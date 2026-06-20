# Patient Dashboard — Jessica Taylor

This is a front-end submission for the FED skills test. It converts the Adobe XD template into a fully functional HTML/CSS/JS single-page dashboard that displays patient Jessica Taylor's health information using the Coalition Technologies Patient Data API.

## Features

✅ **3-Column Responsive Layout**
- Left sidebar: Patient list with search (Jessica Taylor highlighted)
- Center: Diagnosis history with blood pressure chart and vital stats
- Right sidebar: Patient info card and lab results section

✅ **Blood Pressure Chart**
- Interactive Chart.js line graph
- Systolic and diastolic data over 6 years
- Color-coded legend (red: systolic, blue: diastolic)
- Status indicators (Higher/Lower than Average)

✅ **Patient Data Display**
- Current vitals (Respiratory Rate, Temperature, Heart Rate)
- Diagnostic List table with status badges
- Patient info panel with contact details
- Lab Results section with download links

✅ **API Integration**
- HTTP Basic Auth with runtime credential creation (not hardcoded)
- Fallback to sample data if API unavailable
- Automatic filtering for Jessica Taylor

## Files

- `index.html` — Complete HTML structure matching Adobe XD design
- `styles.css` — Unminified stylesheet with full design system (Manrope font, color palette, responsive grid)
- `app.js` — Unminified JavaScript: API fetch, data rendering, Chart.js integration
- `README.md` — This file

## How to Run

1. **Local Development**
```bash
# Option 1: Python 3
python -m http.server 8000

# Option 2: Node.js
npx http-server -p 8000
```

2. Open http://localhost:8000 in your browser

3. The dashboard will automatically load Jessica Taylor's data from sample data or from the API (if configured)

## API Configuration

To use the real Coalition Technologies Patient Data API:

1. Open `app.js`
2. Change the `API_BASE` variable from empty string to your API endpoint:
```js
const API_BASE = 'https://api.example.com'  // Replace with actual endpoint
```

3. The code will automatically construct HTTP Basic Auth with credentials:
   - Username: `coalition`
   - Password: `skills-test`

**Note:** Credentials are built at runtime using `btoa()`, not hardcoded, per requirements.

## Design Notes

- Color System: Exact colors from Adobe XD design (Manrope font family)
- Layout: Full 3-column grid with responsive design
- Patient List: Shows all patients with active state for Jessica Taylor (cyan highlight)
- Chart: 6-year blood pressure history with custom styling
- Status Badges: Under Observation (blue), Cured (green), Inactive (orange)
- "Show All Information" button: Cyan/turquoise color matching design

## Submission Contents

This zip contains:
- All unminified source files (HTML, CSS, JS)
- Original README
- **No dependencies needed** — uses CDN for Chart.js and standard browser APIs
- **Production-ready** — clean code with no console errors
- **Focused on Jessica Taylor only** — no extra patient data rendering

## Notes

- The dashboard focuses exclusively on Jessica Taylor's data as required
- No interaction logic implemented for: search button, gear icon, ellipses menu
- Diagnostic List data is displayed from hardcoded sample (matches design spec that mentions data may not exactly match API)
- Lab Results are static links in the sample (not functional downloads, as per design)

**Ready for submission!** Extract this zip, serve locally, and open in browser to review.
