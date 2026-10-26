// Contenu des 4 fiches (le tiroir qui s'ouvre quand on clique sur une carte).
// Les clés ("template-app"…) correspondent aux data-modal des cartes dans index.html.
// Pour modifier un texte : change simplement la phrase entre les guillemets.

const head = (num, part, title, hook) => `
    <div class="m-eyebrow">${num} · ${part}</div>
    <h2>${title}</h2>
    <p class="m-hook">${hook}</p>`;
const stats = (items) => `<div class="m-stats">${items.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
const tags = (items) => `<div class="m-tags">${items.map((t) => `<span>${t}</span>`).join('')}</div>`;
const timeline = (items) => `<div class="m-timeline">${items.map(([d, t, s]) => `<div><small>${d}</small><b>${t}</b><span>${s}</span></div>`).join('')}</div>`;

export const panelsData = {

    // 01 · Moteur
    'template-app': `
        ${head('01', 'ENGINE', 'App Conception', 'A logistics app for rally teams, built from scratch.')}
        ${stats([
            ['30 pages', 'of PDF schedules replaced'],
            ['Real-time', 'one source of truth for the whole team'],
            ['Own company', 'CarZero, with Paddon Racing Group as a client']
        ])}
        <p>Just as an engine powers a car and is considered its core component, developing my own motorsport logistics app has been the centerpiece of my career to date.</p>
        <p>With the support of <strong>WRC driver Hayden Paddon</strong>, I set out to replace the 30-page PDF schedule files that rally teams still rely on. In the digital age, even top-tier racing teams no longer use this kind of tool. So I used a no-code tool called Glide to handle the logistics of a few rallies during my time at the company, while coding the same app with a much broader vision: bringing it to market.</p>
        <p>That app became <strong>CarZero</strong>: a simple, easy-to-use and 100% customizable solution for rally teams. Building it meant spending hours testing and talking with mechanics, drivers and managers, to make sure it meets everyone's needs.</p>
        ${tags(['Flutter', 'Supabase', 'Glide', 'Product design'])}
        <a class="m-link" href="https://carzeroapp.com" target="_blank" rel="noopener">Visit carzeroapp.com ↗</a>
    `,

    // 02 · Aileron avant
    'template-canada': `
        ${head('02', 'FRONT WING', 'International Experience', 'From Montreal at 15 to New Zealand with a WRC team.')}
        ${stats([
            ['15', 'years old for my first work trip abroad, alone'],
            ['19', 'countries visited'],
            ['5 months', 'of daily English in New Zealand']
        ])}
        <p>Just as the front wing directs the airflow over the entire car, my experiences abroad shaped my ambitions and dreams from a very early age.</p>
        <p>At 15, I set out on my own to develop my international skills, working for one month at the Montreal Skeet Club. I learned how to manage groups of international tourists, developed a high degree of independence, and took the initiative on a facility spanning several dozen hectares.</p>
        <p>That experience gave me the confidence never to be daunted by the prospect of working abroad, and to spend months in Lithuania and in <strong>New Zealand with Hayden Paddon</strong>.</p>
        ${timeline([
            ['SUMMER 2019 · CANADA', 'Operations Assistant', 'Montreal Skeet Club'],
            ['2023 – 2025 · LITHUANIA', 'Erasmus+ year and management internship', 'Vilnius University · Zala Arms'],
            ['APR – AUG 2026 · NEW ZEALAND', 'Management Intern', 'Paddon Racing Group, Cromwell']
        ])}
    `,

    // 03 · Roues
    'template-tracker': `
        ${head('03', 'WHEELS', 'Order Tracker', 'Making the workshop move as fast as the car.')}
        ${stats([
            ['2 tools', 'a job tracking system and a workshop order tracker'],
            ['Apps Script', 'plus custom Chrome extensions'],
            ['Excel', 'automated template for customer quotes']
        ])}
        <p>Just as the wheels are where all of a car's work finally meets the road, a workshop only performs if every order reaches the right person at the right time.</p>
        <p>At Paddon Racing Group, I overhauled management procedures and built a <strong>job tracking system</strong> and a <strong>workshop order tracker</strong> that streamlined technical workflows.</p>
        <p>The tracker relies on custom <strong>Google Apps Script</strong> and Chrome extensions: it connects the management tools to each other and removes administrative friction in the workshop. I also created an automated <strong>Excel cost template</strong> that produces customer quotes.</p>
        ${tags(['Google Apps Script', 'Chrome extensions', 'Excel', 'Process automation'])}
    `,

    // 04 · Aileron arrière
    'template-leader': `
        ${head('04', 'REAR WING', 'Class Leader', 'Spokesperson of the Master\'s in International Sport Administration.')}
        ${stats([
            ['7 / 7', 'days a week as the class\'s main contact'],
            ['SUAPS', 'student representative on the Sports Council'],
            ['University of Lille', 'Master 2, International Sport Administration']
        ])}
        <p>Just as the rear wing keeps the car stable when everything goes fast, a class needs someone who keeps people and information connected.</p>
        <p>As class leader, I am the main contact between students and teaching staff. I relay every document and piece of information, organise the class's events, and handle diplomacy between students and lecturers, helping anyone who needs support, at any time.</p>
        <p>I also represent students on the Sports Council (SUAPS) of the University of Lille, championing the cohort's projects to the administration.</p>
        ${tags(['Diplomacy', 'Communication', 'Event organisation', 'Representation'])}
    `
};
