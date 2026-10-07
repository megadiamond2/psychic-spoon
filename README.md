# Intelligent Traffic Control System Using Fuzzy Logic  
## Cross River State — Final Year Project

Web application for adaptive traffic signal timing at intersections in Cross River State.  
Green-light duration is computed with a **Mamdani Fuzzy Logic** engine (triangular membership functions, rule base, centroid defuzzification) from traffic **density** and **waiting time**.

### Stack
- **Frontend:** HTML5, CSS3, JavaScript (Fuzzy Logic in browser)
- **Backend:** Node.js (built-in `http`, `fs`, `path`, `crypto` — no npm packages)
- **Database:** JSON file (`data/db.json`)

### Project structure
```
traffic-fuzzy/
├── package.json
├── README.md
├── nodejs/
│   ├── server.js      # HTTP server + REST API
│   └── db.js          # JSON database helpers
├── public/            # Static site (served by Node)
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── images/        # Cross River State logo
│   └── … pages
└── data/
    └── db.json        # Users, intersections, history
```

### How to run
1. Install [Node.js](https://nodejs.org/) 16 or higher.
2. Open a terminal in the project root (`traffic-fuzzy`).
3. Start the server:
   ```bash
   node nodejs/server.js
   ```
4. Open a browser: **http://127.0.0.1:5000**

### Demo accounts
| Role     | Email                         | Password  |
|----------|-------------------------------|-----------|
| Admin    | admin@traffic.crs.gov.ng      | admin123  |
| Operator | Register via the site         | —         |

### Features (aligned with Chapter 4 design)
- Operator: select Cross River intersection, enter density & waiting time, run Fuzzy Logic, see green duration + traffic light visualisation, save history.
- Admin: dashboard stats, manage intersections (Calabar, Ikom, Ogoja, Yakurr, etc.), manage operators, full decision history.
- Branding: Cross River State logo and clear project title throughout.

### Hosting notes
- Any host that can run Node.js (or serve static files + a Node process).
- For pure static hosting, API calls will fail unless you point `js/api.js` (`var API = ...`) at a deployed backend.
- Default port: **5000** (override with `PORT` environment variable).
