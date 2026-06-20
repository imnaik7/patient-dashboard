const API_BASE = 'https://fedskillstest.coalitiontechnologies.workers.dev'
const API_USERNAME = 'coalition'
const API_PASSWORD = 'skills-test'

async function fetchPatients() {
  const headers = new Headers()
  headers.set('Authorization', 'Basic ' + btoa(`${API_USERNAME}:${API_PASSWORD}`))
  const res = await fetch(API_BASE, { headers })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : (data.patients || [])
}

function findJessica(patients) {
  return patients.find(p => {
    const name = (p.name || `${p.first_name || ''} ${p.last_name || ''}`).toLowerCase()
    return name.includes('jessica taylor')
  }) || null
}

function getInitials(name) {
  return (name || '').split(' ').slice(0, 2).map(n => n[0] || '').join('').toUpperCase()
}

function renderPatientList(patients) {
  const list = document.getElementById('patientsList')
  list.innerHTML = ''
  patients.forEach(p => {
    const name = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()
    const isJessica = name.toLowerCase().includes('jessica taylor')
    const photoUrl = p.profile_picture || p.photo
    const age = p.age || (p.date_of_birth
      ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()
      : '')

    const item = document.createElement('div')
    item.className = 'patient-item' + (isJessica ? ' active' : '')
    item.innerHTML = `
      ${photoUrl
        ? `<img src="${photoUrl}" alt="${name}" class="patient-avatar-img" />`
        : `<div class="patient-avatar">${getInitials(name)}</div>`}
      <div class="patient-item-details">
        <div class="patient-item-name">${name}</div>
        <div class="patient-item-meta">${p.gender || ''}, ${age}</div>
      </div>
      <div class="patient-menu">⋯</div>
    `
    list.appendChild(item)
  })
}

function formatDate(dob) {
  try {
    return new Date(dob).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  } catch (e) { return dob }
}

function statusClass(status) {
  return (status || '').toLowerCase().replace(/\s+/g, '-')
}

function renderPatient(p) {
  const name = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()

  document.getElementById('patientNameHeader').textContent = name
  document.getElementById('patientMetaHeader').textContent = p.date_of_birth
    ? formatDate(p.date_of_birth) : ''
  document.getElementById('patientInfoName').textContent = name
  document.getElementById('patientDOB').textContent = p.date_of_birth
    ? formatDate(p.date_of_birth) : '—'
  document.getElementById('patientGenderDetail').textContent = p.gender || '—'
  document.getElementById('patientPhone').textContent = p.phone_number || '—'
  document.getElementById('patientEmergency').textContent = p.emergency_contact || '—'
  document.getElementById('patientInsurance').textContent = p.insurance_type || '—'

  const photoUrl = p.profile_picture || p.photo
  if (photoUrl) document.getElementById('patientPhoto').src = photoUrl

  // Vitals from most recent diagnosis_history entry
  const latest = p.diagnosis_history && p.diagnosis_history[0]
  if (latest) {
    const sys = latest.blood_pressure?.systolic
    const dia = latest.blood_pressure?.diastolic
    document.getElementById('systolicValue').textContent = sys?.value ?? '—'
    document.getElementById('diastolicValue').textContent = dia?.value ?? '—'
    document.getElementById('systolicStatus').textContent = sys?.levels || ''
    document.getElementById('diastolicStatus').textContent = dia?.levels || ''
    document.getElementById('respiratoryRate').textContent = latest.respiratory_rate?.value ?? '—'
    document.getElementById('temperatureValue').textContent = latest.temperature?.value ?? '—'
    document.getElementById('heartRateValue').textContent = latest.heart_rate?.value ?? '—'
    document.getElementById('respiratoryRateNote').textContent = latest.respiratory_rate?.levels || ''
    document.getElementById('temperatureNote').textContent = latest.temperature?.levels || ''
    document.getElementById('heartRateNote').textContent = latest.heart_rate?.levels || ''
  }

  // Diagnostic list from API
  const tbody = document.getElementById('diagnosticTableBody')
  if (p.diagnostic_list && Array.isArray(p.diagnostic_list)) {
    tbody.innerHTML = p.diagnostic_list.map(d => `
      <tr>
        <td>${d.name}</td>
        <td>${d.description}</td>
        <td><span class="status-badge ${statusClass(d.status)}">${d.status}</span></td>
      </tr>
    `).join('')
  }

  // Lab results from API
  const labList = document.getElementById('labResultsList')
  if (p.lab_results && Array.isArray(p.lab_results)) {
    labList.innerHTML = p.lab_results.map(lab => `
      <div class="lab-result-item">
        <span class="lab-name">${lab}</span>
        <span class="lab-icon">⬇️</span>
      </div>
    `).join('')
  }
}

function getBpRecords(p) {
  if (!p.diagnosis_history || !Array.isArray(p.diagnosis_history)) return []
  const monthOrder = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]
  return p.diagnosis_history
    .slice()
    .sort((a, b) => a.year !== b.year
      ? a.year - b.year
      : monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month))
    .slice(-6)
    .map(d => ({
      label: `${d.month.slice(0, 3)}, ${d.year}`,
      systolic: d.blood_pressure?.systolic?.value,
      diastolic: d.blood_pressure?.diastolic?.value
    }))
}

let chartInstance = null

function renderChart(records) {
  const canvas = document.getElementById('bpChart')
  if (!canvas) return
  if (chartInstance) chartInstance.destroy()
  chartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: records.map(r => r.label),
      datasets: [
        {
          label: 'Systolic',
          data: records.map(r => r.systolic),
          borderColor: '#E66FD2',
          backgroundColor: 'rgba(230,111,210,0.1)',
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#E66FD2',
          borderWidth: 2
        },
        {
          label: 'Diastolic',
          data: records.map(r => r.diastolic),
          borderColor: '#8C6FE6',
          backgroundColor: 'rgba(140,111,230,0.1)',
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#8C6FE6',
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 60, max: 180, ticks: { color: '#878787' } },
        x: { ticks: { color: '#878787' } }
      }
    }
  })
}

async function init() {
  try {
    const patients = await fetchPatients()
    renderPatientList(patients)
    const jessica = findJessica(patients)
    if (!jessica) {
      document.getElementById('patientNameHeader').textContent = 'Patient not found'
      return
    }
    renderPatient(jessica)
    renderChart(getBpRecords(jessica))
  } catch (e) {
    console.error('Failed to load patient data:', e)
    document.getElementById('patientNameHeader').textContent = 'Error loading data'
  }
}

init()
