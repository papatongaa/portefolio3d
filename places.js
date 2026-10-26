// Données du globe (onglet Experience).
// Pour ajouter un pays : une ligne dans COUNTRIES. Pour ajouter une épingle : un bloc dans PLACES.
// kind des pays : 'home' = pays d'origine · 'work' = j'y ai travaillé / étudié · 'visit' = visité

// Zone affichée quand on zoome sur le pays : [lonMin, latMin, lonMax, latMax]
export const COUNTRIES = {
    '040': { name: 'Austria',        kind: 'home',  note: 'Where I was born · back 2 more times', box: [9.5, 46.3, 17.2, 49.1] },
    '250': { name: 'France',         kind: 'work',  note: 'Where I live and study',               box: [-5.2, 41.3, 9.7, 51.2] },
    '124': { name: 'Canada',         kind: 'work',  note: 'Worked there in 2019 · visited 2 times', box: [-141, 41.5, -52, 62] },
    '440': { name: 'Lithuania',      kind: 'work',  note: 'Erasmus+ and internship, 2023 – 2025', box: [20.9, 53.8, 26.9, 56.5] },
    '554': { name: 'New Zealand',    kind: 'work',  note: 'Paddon Racing Group, 2026',            box: [166.3, -47.4, 178.6, -34.3] },
    '818': { name: 'Egypt',          kind: 'visit', note: 'Visited',                              box: [24.7, 22, 36.9, 31.7] },
    '840': { name: 'United States',  kind: 'visit', note: 'Visited 2 times',                      box: [-125, 24.5, -66.9, 49.4] },
    '826': { name: 'United Kingdom', kind: 'visit', note: 'England 2 times · Scotland 3 times',   box: [-8.7, 49.8, 1.8, 60.9] },
    '276': { name: 'Germany',        kind: 'visit', note: 'Visited 3 times',                      box: [5.8, 47.2, 15.1, 55.1] },
    '348': { name: 'Hungary',        kind: 'visit', note: 'Visited',                              box: [16, 45.7, 22.9, 48.6] },
    '380': { name: 'Italy',          kind: 'visit', note: 'Italian Grand Prix, Monza 2023',       box: [6.6, 36.6, 18.6, 47.1] },
    '056': { name: 'Belgium',        kind: 'visit', note: 'Belgian Grand Prix, Spa 2023',         box: [2.5, 49.4, 6.5, 51.6] },
    '724': { name: 'Spain',          kind: 'visit', note: 'Visited',                              box: [-9.5, 35.9, 4.4, 43.9] },
    '620': { name: 'Portugal',       kind: 'visit', note: 'Visited',                              box: [-9.6, 36.9, -6.1, 42.2] },
    '756': { name: 'Switzerland',    kind: 'visit', note: 'Visited',                              box: [5.9, 45.8, 10.5, 47.9] },
    '428': { name: 'Latvia',         kind: 'visit', note: 'Visited',                              box: [20.9, 55.6, 28.3, 58.1] },
    '246': { name: 'Finland',        kind: 'visit', note: 'Visited',                              box: [20, 59.7, 31.7, 70.2] },
    '504': { name: 'Morocco',        kind: 'visit', note: 'Visited',                              box: [-13.3, 27.6, -1.1, 35.9] },
    '480': { name: 'Mauritius',      kind: 'visit', note: 'Visited',                              box: [57.2, -20.6, 57.9, -19.9] },
    '036': { name: 'Australia',      kind: 'visit', note: 'Visited',                              box: [112.9, -43.7, 153.7, -10.6] },
    '203': { name: 'Czech Republic', kind: 'visit', note: 'Visited', box: [12.1, 48.5, 18.9, 51.1] },
    '882': { name: 'Samoa',          kind: 'visit', note: 'Visited', box: [-172.9, -14.2, -171.3, -13.3] },
    '192': { name: 'Cuba',           kind: 'visit', note: 'Visited',                              box: [-85, 19.7, -74, 23.4] }
};

// Le point de départ des arcs : Steyr, où je suis né
export const ORIGIN = { lat: 48.0386, lon: 14.4208 };  // Steyr

// Épingles. type : 'home' | 'work' | 'gp'. world:true = visible aussi sur le globe entier.
// arc:true = un arc part d'Autriche vers cette épingle.
// photos: ['photos/spa-1.jpg', ...] : mets tes images dans le dossier photos et liste-les ici.
// Les textes viennent des fiches / du CV. Ajoute tes propres anecdotes dans "text".
export const PLACES = [
    {
        id: 'austria', country: '040', type: 'home', world: true,
        name: 'Steyr', lat: 48.0386, lon: 14.4208,
        eyebrow: 'WHERE IT STARTED', title: 'Steyr, Austria', hook: 'Where I was born.',
        text: ''
    },
    {
        id: 'montreal', country: '124', type: 'work', world: true, arc: true,
        name: 'Montreal', lat: 45.5017, lon: -73.5673,
        eyebrow: 'WORK · CANADA', title: 'Montreal Skeet Club', hook: 'Summer 2019 · Operations Assistant',
        text: 'At 15, I set out on my own to develop my international skills, working for one month at the Montreal Skeet Club. I learned how to manage groups of international tourists, developed a high degree of independence, and took the initiative on a facility spanning several dozen hectares.'
    },
    {
        id: 'vilnius', country: '440', type: 'work', world: true, arc: true,
        name: 'Vilnius', lat: 54.6872, lon: 25.2797,
        eyebrow: 'STUDY & WORK · LITHUANIA', title: 'Erasmus+ in Vilnius', hook: '2023 – 2025 · Vilnius University · Zala Arms',
        text: 'An Erasmus+ year at Vilnius University, followed by a management internship at Zala Arms.'
    },
    {
        id: 'cromwell', country: '554', type: 'work', world: true, arc: true,
        name: 'Cromwell', lat: -45.0436, lon: 169.1957,
        eyebrow: 'WORK · NEW ZEALAND', title: 'Paddon Racing Group', hook: 'Apr – Aug 2026 · Management Intern',
        text: 'Five months in Cromwell with Hayden Paddon\'s team: I overhauled management procedures and built a job tracking system and a workshop order tracker.'
    },
    {
        id: 'lille', country: '250', type: 'work', arc: true,
        name: 'Lille', lat: 50.6292, lon: 3.0573,
        eyebrow: 'STUDY · FRANCE', title: 'University of Lille', hook: 'Master 2 · International Sport Administration',
        text: 'Where I study, and where I am class leader: the main contact between students and teaching staff. Also the base of many of my volunteer experiences.'
    },
    {
        id: 'spa', country: '056', type: 'gp', arc: true,
        name: 'Spa-Francorchamps', lat: 50.4372, lon: 5.9714,
        eyebrow: 'GRAND PRIX · BELGIUM', title: 'Belgian Grand Prix', hook: 'Spa-Francorchamps · 2023',
        text: '', photos: []
    },
    {
        id: 'monza', country: '380', type: 'gp', arc: true,
        name: 'Monza', lat: 45.6156, lon: 9.2811,
        eyebrow: 'GRAND PRIX · ITALY', title: 'Italian Grand Prix', hook: 'Autodromo Nazionale Monza · 2023',
        text: '', photos: []
    },
    {
        id: 'paulricard', country: '250', type: 'gp', from: 'lille',
        name: 'Paul Ricard', lat: 43.2506, lon: 5.7919,
        eyebrow: 'GRAND PRIX · FRANCE', title: 'French Grand Prix', hook: 'Circuit Paul Ricard, Le Castellet · 2022',
        text: '', photos: []
    },
    {
        id: 'lemans', country: '250', type: 'gp', from: 'lille',
        name: 'Le Mans', lat: 47.95, lon: 0.2078,
        eyebrow: 'ENDURANCE · FRANCE', title: 'Le Mans', hook: 'GP Explorer 2023 · 24 Hours of Le Mans 2024',
        text: '', photos: []
    },
    {
        id: 'laquais', country: '250', type: 'gp', from: 'lille',
        name: 'Circuit du Laquais', lat: 45.397, lon: 5.222,
        eyebrow: 'DRIVING · FRANCE', title: 'Circuit du Laquais', hook: 'Driving course · 2022',
        text: '', photos: []
    },
    {
        id: 'romans', country: '250', type: 'work', lab: 'l', from: 'lille',
        name: 'Romans-sur-Isère', lat: 45.0425, lon: 5.0508,
        eyebrow: 'VOLUNTEERING · FRANCE', title: 'Romans-sur-Isère', hook: 'Volunteer experiences',
        text: '', photos: []
    },
    {
        id: 'invercargill', country: '554', type: 'gp', lab: 'l', from: 'cromwell',
        name: 'Invercargill', lat: -46.4132, lon: 168.3538,
        eyebrow: 'RALLY · NEW ZEALAND', title: 'Invercargill', hook: 'Rally with Paddon Racing Group',
        text: '', photos: []
    },
    {
        id: 'dunedin', country: '554', type: 'gp', from: 'cromwell',
        name: 'Dunedin', lat: -45.8788, lon: 170.5028,
        eyebrow: 'RALLY · NEW ZEALAND', title: 'Dunedin', hook: 'Rally with Paddon Racing Group',
        text: '', photos: []
    },
    {
        id: 'hastings', country: '554', type: 'gp', from: 'cromwell',
        name: 'Hastings', lat: -39.6381, lon: 176.8492,
        eyebrow: 'RALLY · NEW ZEALAND', title: 'Hastings', hook: 'Rally set up remotely',
        text: '', photos: []
    },
    {
        id: 'whakatane', country: '554', type: 'gp', from: 'cromwell',
        name: 'Whakatane', lat: -37.9533, lon: 176.9922,
        eyebrow: 'RALLY · NEW ZEALAND', title: 'Whakatane · Bay of Plenty', hook: 'Upcoming rally',
        text: '', photos: []
    },
    {
        id: 'us-ny', country: '840', type: 'visit', arc: true,
        name: 'New York City', lat: 40.7128, lon: -74.006,
        eyebrow: 'UNITED STATES', title: 'New York', hook: 'Visited · New York City',
        text: '', photos: []
    },
    {
        id: 'us-ca', country: '840', type: 'visit', from: 'us-ny',
        name: 'Los Angeles', lat: 34.0522, lon: -118.2437,
        eyebrow: 'UNITED STATES', title: 'California', hook: 'Visited · Los Angeles',
        text: '', photos: []
    },
    {
        id: 'us-nv', country: '840', type: 'visit', from: 'us-ny',
        name: 'Las Vegas', lat: 36.1699, lon: -115.1398,
        eyebrow: 'UNITED STATES', title: 'Nevada', hook: 'Visited · Las Vegas',
        text: '', photos: []
    },
    {
        id: 'us-az', country: '840', type: 'visit', from: 'us-ny',
        name: 'Arizona', lat: 34.2, lon: -111.66,
        eyebrow: 'UNITED STATES', title: 'Arizona', hook: 'Visited',
        text: '', photos: []
    },
    {
        id: 'us-co', country: '840', type: 'visit', from: 'us-ny',
        name: 'Colorado', lat: 39.0, lon: -105.55,
        eyebrow: 'UNITED STATES', title: 'Colorado', hook: 'Visited',
        text: '', photos: []
    },
    { id: 'luxor', country: '818', type: 'city', name: 'Luxor', lat: 25.6872, lon: 32.6396 },
    { id: 'london', country: '826', type: 'city', name: 'London', lat: 51.5074, lon: -0.1278 },
    { id: 'edinburgh', country: '826', type: 'city', name: 'Edinburgh', lat: 55.9533, lon: -3.1883 },
    { id: 'aberdeen', country: '826', type: 'city', name: 'Aberdeen', lat: 57.1497, lon: -2.0943 },
    { id: 'hamburg', country: '276', type: 'city', name: 'Hamburg', lat: 53.5511, lon: 9.9937 },
    { id: 'stuttgart', country: '276', type: 'city', name: 'Stuttgart', lat: 48.7758, lon: 9.1829 },
    { id: 'nuremberg', country: '276', type: 'city', name: 'Nuremberg', lat: 49.4521, lon: 11.0767 },
    { id: 'budapest', country: '348', type: 'city', name: 'Budapest', lat: 47.4979, lon: 19.0402 },
    { id: 'barcelona', country: '724', type: 'city', name: 'Barcelona', lat: 41.3851, lon: 2.1734 },
    { id: 'faro', country: '620', type: 'city', name: 'Faro', lat: 37.0194, lon: -7.9304 },
    { id: 'geneva', country: '756', type: 'city', name: 'Geneva', lat: 46.2044, lon: 6.1432 },
    { id: 'riga', country: '428', type: 'city', name: 'Riga', lat: 56.9496, lon: 24.1052 },
    { id: 'tampere', country: '246', type: 'city', name: 'Tampere', lat: 61.4978, lon: 23.761 },
    { id: 'essaouira', country: '504', type: 'city', name: 'Essaouira', lat: 31.5085, lon: -9.7595 },
    { id: 'portlouis', country: '480', type: 'city', name: 'Port Louis', lat: -20.1609, lon: 57.5012 },
    { id: 'sydney', country: '036', type: 'city', name: 'Sydney', lat: -33.8688, lon: 151.2093 },
    { id: 'canberra', country: '036', type: 'city', name: 'Canberra', lat: -35.2809, lon: 149.13 },
    { id: 'havana', country: '192', type: 'city', name: 'Havana', lat: 23.1136, lon: -82.3666 },
    { id: 'prague', country: '203', type: 'city', name: 'Prague', lat: 50.0755, lon: 14.4378 },
    { id: 'apia', country: '882', type: 'city', name: 'Apia', lat: -13.8333, lon: -171.7667 },
    {
        id: 'algarve', country: '620', type: 'gp', from: 'faro',
        name: 'Algarve Circuit', lat: 37.2272, lon: -8.6267,
        eyebrow: 'RACE · PORTUGAL', title: 'Autódromo Internacional do Algarve', hook: 'Porsche Cup · Southwest Europe round',
        text: '', photos: []
    },
];
