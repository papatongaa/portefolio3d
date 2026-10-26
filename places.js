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
    '192': { name: 'Cuba',           kind: 'visit', note: 'Visited',                              box: [-85, 19.7, -74, 23.4] }
};

// Le point de départ des arcs
export const ORIGIN = { lat: 47.6, lon: 14.3 };

// Épingles. type : 'home' | 'work' | 'gp'. world:true = visible aussi sur le globe entier.
// arc:true = un arc part d'Autriche vers cette épingle.
// Les textes viennent des fiches / du CV. Ajoute tes propres anecdotes dans "text".
export const PLACES = [
    {
        id: 'austria', country: '040', type: 'home', world: true,
        name: 'Austria', lat: 47.6, lon: 14.3,
        eyebrow: 'WHERE IT STARTED', title: 'Austria', hook: 'Born here, back two more times.',
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
        id: 'lille', country: '250', type: 'work',
        name: 'Lille', lat: 50.6292, lon: 3.0573,
        eyebrow: 'STUDY · FRANCE', title: 'University of Lille', hook: 'Master 2 · International Sport Administration',
        text: 'Where I study, and where I am class leader: the main contact between students and teaching staff.'
    },
    {
        id: 'spa', country: '056', type: 'gp',
        name: 'Spa-Francorchamps', lat: 50.4372, lon: 5.9714,
        eyebrow: 'GRAND PRIX · BELGIUM', title: 'Belgian Grand Prix', hook: 'Spa-Francorchamps · 2023',
        text: ''
    },
    {
        id: 'monza', country: '380', type: 'gp',
        name: 'Monza', lat: 45.6156, lon: 9.2811,
        eyebrow: 'GRAND PRIX · ITALY', title: 'Italian Grand Prix', hook: 'Autodromo Nazionale Monza · 2023',
        text: ''
    }
];
