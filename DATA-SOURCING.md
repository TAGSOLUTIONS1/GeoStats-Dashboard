# Data sourcing status for the 20 locked data points

Researched 16 Sep 2026. Every endpoint below was reachability-tested from this
machine; the test result is recorded so nobody repeats the work.

The `source:` strings in `src/data/sidebarData.js` previously read "Zillow" for
19 of these 20 points — a placeholder inherited from a US template. Zillow has
no UAE coverage. Those strings have been replaced with the real intended source
and its current status.

---

## Reachability tests (16 Sep 2026, from a non-UAE IP)

| Endpoint | Result | Meaning |
|---|---|---|
| `api.dubaipulse.gov.ae/open/dld/...` | **401** | Live, needs OAuth key + secret from a registered Dubai Pulse account |
| `www.dubaipulse.gov.ae` | **connection refused** | Geo-restricted; dataset browsing needs a UAE IP or VPN |
| `dubailand.gov.ae/en/open-data/real-estate-data/` | **200** | Reachable; CSV downloads behind interactive filters |
| `overpass-api.de/api/interpreter` | **200** | Works; requires a `User-Agent` header or returns 406 |
| `api.worldbank.org` | **200** | Works, no auth |
| `fcsc.gov.ae` | **403** | Blocked |
| `dsc.gov.ae` | **302** | Reachable, redirects |

---

## Verdicts

### A. Blocked on Dubai Pulse credentials — 1 point

**Inventory as % of Houses** needs housing stock per community as the
denominator. Nothing in this repo holds per-community stock
(`dsc/housing-units.json` is a Dubai-wide series, 9 points, 1980–2019).

DLD publishes nine open-data categories, of which this project currently uses
two. The unused ones that matter here are **Units** and **Buildings**.

Action: register for Dubai Pulse, obtain API key + secret, pull
`dld_units` / `dld_buildings`, aggregate to `COMM_NUM`.

Registering also replaces every Kaggle and Hugging Face mirror currently
feeding ~30 live data points with an official government feed — the single
highest-value item found in this research, well beyond the one metric it
unblocks.

### B. Blocked on a paid listings dataset — 8 points

Price Cut %, New Listing Count, New Listings Count (YoY), Sale Inventory
Growth (MoM), Sale Inventory Growth (YoY), Inventory Surplus/Deficit,
Days on Market Growth (YoY), and the growth half of any inventory metric.

All eight need a **listings time series**, not a snapshot. A transaction
registry records completed deals and can never produce them.

BayutAPI (`bayutapi.dev`, via RapidAPI) prices its live API at free/900 req,
$20/30k, $60/100k, $200/500k — but its documented fields are only
`externalID, title, price, currency, rooms, baths, area, purpose, location,
agency`. **No listing date, no days-on-market, no price history.** Those sit in
a separate product it calls a "Listings Dataset — bulk listing data and change
history", which is the thing to actually price.

Both BayutAPI and PropertyfinderAPI are **unofficial** and not affiliated with
the portals. Apify scrapers are a cheaper fallback with the same caveat.
REIDIN and Property Monitor (Dubizzle-owned) sell transaction-based indices and
deliberately exclude live listings, so they do not solve this.

### C. Emirate-level only, cannot be a map layer — 2 points

**Homeownership Rate**, **Remote Work %**.

The DSC Household Income and Expenditure Survey does cover housing
characteristics and runs every 5 years, but its sample is **3,960 households**
total (1,476 Emirati, 1,572 non-Emirati, 672 collective, 240 labourers).
Spread over 226 communities that is ~17 households each — far below any
credible threshold. These can ship as emirate-level cards, never as choropleths.

### D. Investigated and found NOT viable — 3 points

**Senior Care Facilities.** Previously recorded as an OSM quick win. It is not.
A live Overpass query over the Dubai bounding box for `amenity=social_facility`,
`amenity=nursing_home` and `social_facility=*` returned **17 elements total**,
and the tags are largely wrong — "Chubby Cheeks" is a children's nursery tagged
`amenity=nursing_home`; several entries are literally named "home" / "my. home";
the rest are food banks, charity boxes and social clubs. Perhaps two are
genuinely senior-related. Dubai CDA runs the Elderly Happiness Centre and the
Waleef home-care programme but publishes no facility list.

**Average grocery cost**, **Average clothing cost.** Previously recorded as a
CPI quick win. The World Bank exposes only the headline CPI
(`FP.CPI.TOTL`) for the UAE — already wired as Average Living Cost.
`FP.CPI.FOOD` is not a valid indicator, and a scan of the World Bank indicator
catalogue returned **zero** matches for food or clothing price indices. FCSC
publishes CPI sub-indices in its monthly reports but the site returns 403 from
here, and it was not possible to confirm it publishes average prices in AED
rather than index points.

### E. Recommend deleting from the registry — 5 points

| Data point | Why |
|---|---|
| Vacancy Rate | No official statistic exists. Press estimates put 15–20% of Dubai units unoccupied; that is journalism. DEWA active connections is the standard proxy and DEWA does not publish it. |
| Vacant Home % | Same. |
| Rental Vacancy Rate | Same. Lease Renewal Rate (already live, 136 communities) is the nearest honest substitute and measures tenant retention, not vacancy. |
| Average Debt to Income | Al Etihad Credit Bureau is the only federal credit bureau and publishes **no aggregate statistics**. The sole public figure is the Central Bank's regulatory 50% debt-burden cap — a rule, not a measurement. |
| Foreclosure Rate | A source does exist — **eMart**, DLD's official auction platform, covering court-ordered sales, bank repossessions and developer disposals. But auctions run roughly **15–20 properties every few months across all of Dubai**, with no API and no downloadable history. Far too thin for a per-community rate, permanently. |

### F. Held on quality, not availability — 1 point

**Home Price Forecast.** Data is fully bundled: 4 model families × 117 areas ×
48 months, joining to 115 of 226 communities. Held because 77% of communities
are predicted to fall (ensemble median −8%, p5 −39%) against live data showing
+24% (2024) and +11% (2025); one model (`svr`) outputs a flat line
(max/min = 1.01); and the input series has a median month-over-month swing of
10.5%. Needs the history smoothed and the models re-fit.

### G. Still genuinely unsourced — 1 point

**Shadow Inventory %.** No UAE equivalent found, and the concept (bank-held
repossessions awaiting release to market) does not map onto a market with no
foreclosure pipeline at scale.

---

## Summary

| Status | Points |
|---|---|
| Blocked on Dubai Pulse credentials | 1 |
| Blocked on a paid listings dataset | 8 |
| Emirate-level card only | 2 |
| Investigated, not viable | 3 |
| Recommend deleting | 5 |
| Held on model quality | 1 |
| Genuinely unsourced | 1 |

Realistic ceiling if Dubai Pulse access and a listings dataset are obtained:
**11 of 20 recoverable**, taking the catalogue to 102 of 111 live (92%).
Five should be removed from the registry rather than left permanently crowned —
a crown that never resolves trains users to ignore it.

## Sources

- Dubai Pulse DLD transactions: https://www.dubaipulse.gov.ae/data/dld-transactions/dld_transactions-open-api
- Dubai Pulse DLD rent contracts: https://www.dubaipulse.gov.ae/data/dld-registration/dld_rent_contracts-open-api
- Dubai Pulse DSC housing units: https://www.dubaipulse.gov.ae/data/dsc-statistics/dsc_housing_unit-open
- DLD open data portal: https://dubailand.gov.ae/en/open-data/real-estate-data/
- BayutAPI: https://bayutapi.dev/
- PropertyfinderAPI (unofficial): https://propertyfinderapi.com/
- DSC Household Income & Expenditure Survey: https://www.dsc.gov.ae/en-us/Programs-Statistical-Surveys/Pages/Statistical-Project-details.aspx?ProjectId=23
- Dubai property auctions / eMart: https://egsh.ae/insights/property-auctions-dubai
- UAE debt burden ratio cap: https://www.lenddoo.com/blog/debt-burden-ratio-uae
- Dubai CDA seniors: https://www.cda.gov.ae/en/socialcare/SeniorCitizens/pages/default.aspx
