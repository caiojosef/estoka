// Dashboard — dados fictícios, gráficos em SVG puro, e ciclo de vida init/destroy
export function init(ctx) {
    const { el, abort } = ctx;

    // elementos
    const rangeButtons = el.querySelectorAll('.db-toolbar [data-range]');
    const rangeLabel = el.querySelector('#rangeLabel');
    const chartDailyEl = el.querySelector('#chartDaily');

    // KPIs
    const kpiToday = el.querySelector('#kpiToday');
    const kpiTodayDelta = el.querySelector('#kpiTodayDelta');
    const kpi7d = el.querySelector('#kpi7d');
    const kpi30d = el.querySelector('#kpi30d');
    const kpiWhats = el.querySelector('#kpiWhats');
    const kpiWhatsDelta = el.querySelector('#kpiWhatsDelta');
    const kpiCTR = el.querySelector('#kpiCTR');
    const kpiCTRDelta = el.querySelector('#kpiCTRDelta');
    const kpiTime = el.querySelector('#kpiTime');
    const kpiTimeDelta = el.querySelector('#kpiTimeDelta');

    // Sparklines
    const spark7dEl = el.querySelector('#spark7d');
    const spark30dEl = el.querySelector('#spark30d');

    // Fontes
    const srcEls = {
        instagram: { bar: el.querySelector('#srcInstagram'), pct: el.querySelector('#srcInstagramPct') },
        direto: { bar: el.querySelector('#srcDireto'), pct: el.querySelector('#srcDiretoPct') },
        whats: { bar: el.querySelector('#srcWhats'), pct: el.querySelector('#srcWhatsPct') },
        google: { bar: el.querySelector('#srcGoogle'), pct: el.querySelector('#srcGooglePct') },
        outros: { bar: el.querySelector('#srcOutros'), pct: el.querySelector('#srcOutrosPct') }
    };

    // Tabela
    const lastAccessBody = el.querySelector('#lastAccessBody');

    // estado
    let currentRange = 14;
    let cleanupFns = [];

    // helpers de números
    const nf = new Intl.NumberFormat('pt-BR');
    const pf = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

    // gera dados fictícios
    function genDaily(range) {
        const base = 40 + Math.round(Math.random() * 30);
        const arr = Array.from({ length: range }, (_, i) => {
            const season = 1 + Math.sin((i / range) * Math.PI * 1.2) * 0.35;
            const noise = (Math.random() * 0.4 + 0.8);
            return Math.max(5, Math.round(base * season * noise));
        });
        return arr;
    }

    function genSources(total) {
        // proporções aleatórias mas plausíveis
        let instagram = 0.34 + (Math.random() * 0.1 - 0.05);
        let direto = 0.26 + (Math.random() * 0.1 - 0.05);
        let whats = 0.18 + (Math.random() * 0.08 - 0.04);
        let google = 0.16 + (Math.random() * 0.08 - 0.04);
        let outros = 1 - (instagram + direto + whats + google);
        // normaliza
        const clamp = v => Math.max(0.02, v);
        instagram = clamp(instagram); direto = clamp(direto); whats = clamp(whats); google = clamp(google); outros = clamp(outros);
        const sum = instagram + direto + whats + google + outros;
        return {
            instagram: Math.round(total * (instagram / sum)),
            direto: Math.round(total * (direto / sum)),
            whats: Math.round(total * (whats / sum)),
            google: Math.round(total * (google / sum)),
            outros: Math.round(total * (outros / sum))
        };
    }

    function drawBarChart(container, data) {
        const max = Math.max(...data) || 1;
        const W = container.clientWidth || 600;
        const H = container.clientHeight || 220;
        const m = { t: 14, r: 10, b: 24, l: 24 };
        const cw = W - m.l - m.r;
        const ch = H - m.t - m.b;
        const bw = Math.max(6, Math.floor(cw / data.length) - 6);

        let bars = '';
        data.forEach((v, i) => {
            const h = Math.round((v / max) * ch);
            const x = m.l + i * (bw + 6);
            const y = m.t + (ch - h);
            bars += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="4" ry="4" fill="url(#g1)"></rect>`;
        });

        // eixo Y (linhas guia)
        let grid = '';
        for (let i = 0; i <= 4; i++) {
            const y = m.t + Math.round((i / 4) * ch);
            grid += `<line x1="${m.l}" y1="${y}" x2="${m.l + cw}" y2="${y}" stroke="#EAF1F6"></line>`;
        }

        container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Gráfico de barras">
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stop-color="${getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#179FDA'}" />
            <stop offset="100%" stop-color="#20b4f0" />
          </linearGradient>
        </defs>
        <g>${grid}</g>
        <g>${bars}</g>
      </svg>
    `;
    }

    function drawSpark(container, data) {
        const W = container.clientWidth || 120;
        const H = container.clientHeight || 32;
        const max = Math.max(...data) || 1;
        const min = Math.min(...data) || 0;
        const dx = W / (data.length - 1);
        const norm = v => (H - 2) - ((v - min) / (max - min || 1)) * (H - 6);

        let d = '';
        data.forEach((v, i) => { d += (i === 0 ? 'M' : 'L') + (i * dx).toFixed(1) + ' ' + norm(v).toFixed(1) + ' '; });

        container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        <path d="${d}" fill="none" stroke="#20b4f0" stroke-width="2" />
      </svg>
    `;
    }

    function update(range) {
        currentRange = range;
        rangeLabel.textContent = `Últimos ${range} dias`;

        // dados
        const daily = genDaily(range);
        const total = daily.reduce((a, b) => a + b, 0);
        const today = daily[daily.length - 1];
        const prev = daily[daily.length - 2] || today;

        // KPIs
        kpiToday.textContent = nf.format(today);
        const todayDelta = ((today - prev) / (prev || 1));
        kpiTodayDelta.textContent = (todayDelta >= 0 ? '▲' : '▼') + ' ' + pf.format(Math.abs(todayDelta));
        kpiTodayDelta.classList.toggle('kpi__delta--pos', todayDelta >= 0);
        kpiTodayDelta.classList.toggle('kpi__delta--neg', todayDelta < 0);

        const last7 = daily.slice(-7).reduce((a, b) => a + b, 0);
        const last30 = range >= 30 ? total : (total + Math.round(total * (30 - range) / range * 0.6)); // aproximação fictícia
        kpi7d.textContent = nf.format(last7);
        kpi30d.textContent = nf.format(last30);

        // cliques Whats/CTR (fictícios proporcionais)
        const whats = Math.round(total * (0.18 + Math.random() * 0.06));
        const ctr = whats / (total || 1);
        const ctrDelta = (Math.random() * 0.2 - 0.1); // variação fictícia
        kpiWhats.textContent = nf.format(whats);
        kpiWhatsDelta.textContent = (ctrDelta >= 0 ? '▲ ' : '▼ ') + pf.format(Math.abs(ctrDelta));
        kpiWhatsDelta.classList.toggle('kpi__delta--pos', ctrDelta >= 0);
        kpiWhatsDelta.classList.toggle('kpi__delta--neg', ctrDelta < 0);

        kpiCTR.textContent = pf.format(ctr);
        kpiCTRDelta.textContent = (ctrDelta >= 0 ? '▲ ' : '▼ ') + pf.format(Math.abs(ctrDelta));
        kpiCTRDelta.classList.toggle('kpi__delta--pos', ctrDelta >= 0);
        kpiCTRDelta.classList.toggle('kpi__delta--neg', ctrDelta < 0);

        // tempo médio (fictício 45–95s)
        const tAvg = 45 + Math.round(Math.random() * 50);
        const tDelta = (Math.random() * 0.25 - 0.12);
        kpiTime.textContent = `${tAvg}s`;
        kpiTimeDelta.textContent = (tDelta >= 0 ? '▲ ' : '▼ ') + pf.format(Math.abs(tDelta));
        kpiTimeDelta.classList.toggle('kpi__delta--pos', tDelta >= 0);
        kpiTimeDelta.classList.toggle('kpi__delta--neg', tDelta < 0);

        // gráficos
        drawBarChart(chartDailyEl, daily);
        drawSpark(spark7dEl, daily.slice(-7));
        drawSpark(spark30dEl, range >= 30 ? daily.slice(-30) : daily);

        // fontes
        const sources = genSources(total);
        const sum = Object.values(sources).reduce((a, b) => a + b, 0) || 1;
        function setSrc(key) {
            const pct = sources[key] / sum;
            srcEls[key].bar.style.width = Math.max(6, Math.round(pct * 100)) + '%';
            srcEls[key].pct.textContent = pf.format(pct);
        }
        setSrc('instagram'); setSrc('direto'); setSrc('whats'); setSrc('google'); setSrc('outros');

        // tabela (10 linhas fictícias)
        const origins = ['Instagram', 'Direto', 'WhatsApp', 'Google', 'Outros'];
        const devices = ['Mobile', 'Desktop'];
        const places = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'PE', 'CE'];
        const now = new Date();
        let rows = '';
        for (let i = 0; i < 10; i++) {
            const d = new Date(now.getTime() - i * 3600 * 1000 * (1 + Math.random() * 6));
            const ds = d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const o = origins[Math.floor(Math.random() * origins.length)];
            const dv = devices[Math.random() > 0.25 ? 0 : 1];
            const pl = places[Math.floor(Math.random() * places.length)];
            rows += `<tr><td>${ds}</td><td>${o}</td><td>${dv}</td><td>${pl}</td></tr>`;
        }
        lastAccessBody.innerHTML = rows;
    }

    // listeners período
    function onRangeClick(e) {
        const r = parseInt(e.currentTarget.getAttribute('data-range'), 10) || 14;
        update(r);
    }
    rangeButtons.forEach(b => {
        b.addEventListener('click', onRangeClick);
        cleanupFns.push(() => b.removeEventListener('click', onRangeClick));
    });

    // responsivo: redesenha ao redimensionar
    function onResize() { drawBarChart(chartDailyEl, currentDataDummy()); } // reusa último dataset
    // guardamos uma cópia do último daily para redesenhar com mesma base
    let lastDaily = [];
    function currentDataDummy() { return lastDaily.length ? lastDaily : genDaily(currentRange); }
    const ro = new ResizeObserver(() => drawBarChart(chartDailyEl, lastDaily.length ? lastDaily : genDaily(currentRange)));
    ro.observe(chartDailyEl);
    cleanupFns.push(() => ro.disconnect());

    // patch update para armazenar lastDaily
    const _update = update;
    update = function (range) {
        const daily = genDaily(range);
        lastDaily = daily.slice();
        // chama render com série já calculada
        currentRange = range;
        rangeLabel.textContent = `Últimos ${range} dias`;
        // recalcula KPIs e gráficos usando daily salvo
        // (duplicamos trechos essenciais para manter simples)
        const total = daily.reduce((a, b) => a + b, 0);
        const today = daily[daily.length - 1];
        const prev = daily[daily.length - 2] || today;

        kpiToday.textContent = nf.format(today);
        const todayDelta = ((today - prev) / (prev || 1));
        kpiTodayDelta.textContent = (todayDelta >= 0 ? '▲' : '▼') + ' ' + pf.format(Math.abs(todayDelta));
        kpiTodayDelta.classList.toggle('kpi__delta--pos', todayDelta >= 0);
        kpiTodayDelta.classList.toggle('kpi__delta--neg', todayDelta < 0);

        const last7 = daily.slice(-7).reduce((a, b) => a + b, 0);
        const last30 = range >= 30 ? total : (total + Math.round(total * (30 - range) / range * 0.6));
        kpi7d.textContent = nf.format(last7);
        kpi30d.textContent = nf.format(last30);

        const whats = Math.round(total * (0.18 + Math.random() * 0.06));
        const ctr = whats / (total || 1);
        const ctrDelta = (Math.random() * 0.2 - 0.1);
        kpiWhats.textContent = nf.format(whats);
        kpiWhatsDelta.textContent = (ctrDelta >= 0 ? '▲ ' : '▼ ') + pf.format(Math.abs(ctrDelta));
        kpiWhatsDelta.classList.toggle('kpi__delta--pos', ctrDelta >= 0);
        kpiWhatsDelta.classList.toggle('kpi__delta--neg', ctrDelta < 0);

        kpiCTR.textContent = pf.format(ctr);
        kpiCTRDelta.textContent = (ctrDelta >= 0 ? '▲ ' : '▼ ') + pf.format(Math.abs(ctrDelta));
        kpiCTRDelta.classList.toggle('kpi__delta--pos', ctrDelta >= 0);
        kpiCTRDelta.classList.toggle('kpi__delta--neg', ctrDelta < 0);

        const tAvg = 45 + Math.round(Math.random() * 50);
        const tDelta = (Math.random() * 0.25 - 0.12);
        kpiTime.textContent = `${tAvg}s`;
        kpiTimeDelta.textContent = (tDelta >= 0 ? '▲ ' : '▼ ') + pf.format(Math.abs(tDelta));
        kpiTimeDelta.classList.toggle('kpi__delta--pos', tDelta >= 0);
        kpiTimeDelta.classList.toggle('kpi__delta--neg', tDelta < 0);

        drawBarChart(chartDailyEl, daily);
        drawSpark(spark7dEl, daily.slice(-7));
        drawSpark(spark30dEl, range >= 30 ? daily.slice(-30) : daily);

        const sources = genSources(total);
        const sum = Object.values(sources).reduce((a, b) => a + b, 0) || 1;
        function setSrc(key) {
            const pct = sources[key] / sum;
            srcEls[key].bar.style.width = Math.max(6, Math.round(pct * 100)) + '%';
            srcEls[key].pct.textContent = pf.format(pct);
        }
        setSrc('instagram'); setSrc('direto'); setSrc('whats'); setSrc('google'); setSrc('outros');

        // tabela
        const origins = ['Instagram', 'Direto', 'WhatsApp', 'Google', 'Outros'];
        const devices = ['Mobile', 'Desktop'];
        const places = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'PE', 'CE'];
        const now = new Date();
        let rows = '';
        for (let i = 0; i < 10; i++) {
            const d = new Date(now.getTime() - i * 3600 * 1000 * (1 + Math.random() * 6));
            const ds = d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const o = origins[Math.floor(Math.random() * origins.length)];
            const dv = devices[Math.random() > 0.25 ? 0 : 1];
            const pl = places[Math.floor(Math.random() * places.length)];
            rows += `<tr><td>${ds}</td><td>${o}</td><td>${dv}</td><td>${pl}</td></tr>`;
        }
        lastAccessBody.innerHTML = rows;
    };

    // primeira renderização (14 dias)
    update(14);

    // limpeza
    return function destroy() {
        cleanupFns.forEach(fn => { try { fn(); } catch (_) { } });
        if (abort && abort.abort) abort.abort();
    };
}

export function destroy() { /* redundância para o loader */ }
