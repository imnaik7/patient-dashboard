const API_BASE = 'https://fedskillstest.coalitiontechnologies.workers.dev'
const API_USERNAME = 'coalition'
const API_PASSWORD = 'skills-test'

let allPatients = []
let chartInstance = null

// ── Fetch ────────────────────────────────────────────────────────────────────
async function fetchPatients() {
  const headers = new Headers()
  headers.set('Authorization', 'Basic ' + btoa(`${API_USERNAME}:${API_PASSWORD}`))
  const res = await fetch(API_BASE, { headers })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : (data.patients || [])
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  return (name || '').split(' ').slice(0, 2).map(n => n[0] || '').join('').toUpperCase()
}

function formatDate(dob) {
  try {
    return new Date(dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch (e) { return dob }
}

function statusClass(status) {
  return (status || '').toLowerCase().replace(/\s+/g, '-')
}

// ── Patient List ─────────────────────────────────────────────────────────────
function renderPatientList(patients) {
  allPatients = patients
  const list = document.getElementById('patientsList')
  list.innerHTML = ''

  patients.forEach((p, index) => {
    const name = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()
    const photoUrl = p.profile_picture || p.photo
    const age = p.age || (p.date_of_birth
      ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()
      : '')

    const item = document.createElement('div')
    item.className = 'patient-item'
    item.dataset.index = index          // store index as data attribute

    item.innerHTML = `
      ${photoUrl
        ? `<img src="${photoUrl}" alt="${name}" class="patient-avatar-img" />`
        : `<div class="patient-avatar">${getInitials(name)}</div>`}
      <div class="patient-item-details">
        <div class="patient-item-name">${name}</div>
        <div class="patient-item-meta">${p.gender || ''}, ${age}</div>
      </div>
      <span class="patient-menu">&#8943;</span>
    `
    list.appendChild(item)
  })

  // Single event-delegated listener on the container
  list.addEventListener('click', (e) => {
    const item = e.target.closest('.patient-item')
    if (!item) return
    const index = parseInt(item.dataset.index, 10)
    if (!isNaN(index)) selectPatient(index)
  })
}

// ── Select Patient ───────────────────────────────────────────────────────────
function selectPatient(index) {
  // Update active highlight
  document.querySelectorAll('.patient-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.index === String(index))
  })

  const patient = allPatients[index]
  if (!patient) return

  renderPatient(patient)
  renderChart(getBpRecords(patient))

  // Mobile: switch to detail view
  if (window.innerWidth <= 768) {
    document.querySelector('.patients-sidebar').classList.add('sidebar-hidden')
    document.querySelector('.main-content').classList.add('detail-visible')
    document.querySelector('.info-sidebar').classList.add('detail-visible')
    document.getElementById('backBtn').style.display = 'flex'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// ── Render Patient Detail ────────────────────────────────────────────────────
function renderPatient(p) {
  const name = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim()

  setText('patientNameHeader', name)
  setText('patientMetaHeader', p.date_of_birth ? formatDate(p.date_of_birth) : '')
  setText('patientInfoName', name)
  setText('patientDOB', p.date_of_birth ? formatDate(p.date_of_birth) : '—')
  setText('patientGenderDetail', p.gender || '—')
  setText('patientPhone', p.phone_number || '—')
  setText('patientEmergency', p.emergency_contact || '—')
  setText('patientInsurance', p.insurance_type || '—')

  // Photo
  const photoEl = document.getElementById('patientPhoto')
  if (photoEl) {
    photoEl.src = (p.profile_picture || p.photo) ||
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23E0E7FF'/%3E%3Ctext x='50%25' y='50%25' font-size='40' fill='%23007BC7' text-anchor='middle' dy='.35em' font-family='sans-serif' font-weight='700'%3E${getInitials(name)}%3C/text%3E%3C/svg%3E`
  }

  // Vitals from most recent diagnosis_history entry
  const latest = p.diagnosis_history?.[0]
  if (latest) {
    const sys = latest.blood_pressure?.systolic
    const dia = latest.blood_pressure?.diastolic
    setText('systolicValue',  sys?.value  ?? '—')
    setText('diastolicValue', dia?.value  ?? '—')
    setText('systolicStatus',  sys?.levels || '')
    setText('diastolicStatus', dia?.levels || '')
    setText('respiratoryRate',     latest.respiratory_rate?.value ?? '—')
    setText('temperatureValue',    latest.temperature?.value      ?? '—')
    setText('heartRateValue',      latest.heart_rate?.value       ?? '—')
    setText('respiratoryRateNote', latest.respiratory_rate?.levels || '')
    setText('temperatureNote',     latest.temperature?.levels      || '')
    setText('heartRateNote',       latest.heart_rate?.levels       || '')
  } else {
    ['systolicValue','diastolicValue','systolicStatus','diastolicStatus',
     'respiratoryRate','temperatureValue','heartRateValue',
     'respiratoryRateNote','temperatureNote','heartRateNote'].forEach(id => setText(id, '—'))
  }

  // Diagnostic list
  const tbody = document.getElementById('diagnosticTableBody')
  if (tbody) {
    tbody.innerHTML = (p.diagnostic_list?.length)
      ? p.diagnostic_list.map(d => `
          <tr>
            <td>${d.name}</td>
            <td>${d.description}</td>
            <td><span class="status-badge ${statusClass(d.status)}">${d.status}</span></td>
          </tr>`).join('')
      : '<tr><td colspan="3" style="text-align:center;color:#878787;padding:20px">No diagnostics available</td></tr>'
  }

  // Lab results
  const labList = document.getElementById('labResultsList')
  if (labList) {
    labList.innerHTML = (p.lab_results?.length)
      ? p.lab_results.map(lab => `
          <div class="lab-result-item">
            <span class="lab-name">${lab}</span>
            <span class="lab-icon">&#8681;</span>
          </div>`).join('')
      : '<p style="color:#878787;font-size:13px;padding:8px 0">No lab results available</p>'
  }
}

function setText(id, value) {
  const el = document.getElementById(id)
  if (el) el.textContent = value
}

// ── BP Chart ─────────────────────────────────────────────────────────────────
function getBpRecords(p) {
  if (!p.diagnosis_history?.length) return []
  const monthOrder = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December']
  return p.diagnosis_history
    .slice()
    .sort((a, b) => a.year !== b.year ? a.year - b.year : monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month))
    .slice(-6)
    .map(d => ({
      label:     `${d.month.slice(0, 3)}, ${d.year}`,
      systolic:  d.blood_pressure?.systolic?.value,
      diastolic: d.blood_pressure?.diastolic?.value
    }))
}

function renderChart(records) {
  const canvas = document.getElementById('bpChart')
  if (!canvas) return
  if (chartInstance) { chartInstance.destroy(); chartInstance = null }
  if (!records.length) return

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
          tension: 0.4, pointRadius: 5,
          pointBackgroundColor: '#E66FD2', borderWidth: 2
        },
        {
          label: 'Diastolic',
          data: records.map(r => r.diastolic),
          borderColor: '#8C6FE6',
          backgroundColor: 'rgba(140,111,230,0.1)',
          tension: 0.4, pointRadius: 5,
          pointBackgroundColor: '#8C6FE6', borderWidth: 2
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

// ── Back Button (mobile) ──────────────────────────────────────────────────────
function initBackButton() {
  const btn = document.getElementById('backBtn')
  if (!btn) return
  btn.addEventListener('click', () => {
    document.querySelector('.patients-sidebar').classList.remove('sidebar-hidden')
    document.querySelector('.main-content').classList.remove('detail-visible')
    document.querySelector('.info-sidebar').classList.remove('detail-visible')
    btn.style.display = 'none'
  })
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  initBackButton()
  try {
    const patients = await fetchPatients()
    renderPatientList(patients)

    // Default to Jessica Taylor, fall back to first patient
    const jessicaIndex = patients.findIndex(p =>
      (p.name || '').toLowerCase().includes('jessica taylor')
    )
    const startIndex = jessicaIndex >= 0 ? jessicaIndex : 0
    selectPatient(startIndex)

    // Desktop: make detail panels visible immediately
    if (window.innerWidth > 768) {
      document.querySelector('.main-content')?.classList.add('detail-visible')
      document.querySelector('.info-sidebar')?.classList.add('detail-visible')
    }
  } catch (e) {
    console.error('Failed to load data:', e)
    setText('patientNameHeader', 'Error loading patient data')
  }
}

init()
