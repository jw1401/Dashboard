/**
 * DASHBOARD KERNEL v1.0
 * Ein minimalistisches Framework für SPAs ohne Bibliotheken.
 */
const Dashboard = {
    contentArea: document.getElementById('content-area'),
    navLinks: document.querySelectorAll('.nav-link'),

    // Initialisierung
    init() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigate(page);

                // UI-Update: Aktiven Link markieren
                this.navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Startseite laden
        this.navigate('home');
    },

    // Die Kern-Funktion für den Seitenwechsel
    async navigate(pageName) {
        // 1. CLEANUP: Die Umgebung säubern
        this.destroy();

        try {
            const response = await fetch(`pages/${pageName}.html`);

            if (!response.ok) throw new Error(`Status: ${response.status}`);

            const html = await response.text();

            // 2. RENDERING: Inhalt einfügen
            this.contentArea.innerHTML = html;

            // 3. SCRIPT-EXECUTION: Skripte isoliert ausführen
            this.executeScripts();

        } catch (error) {
            this.contentArea.innerHTML = `
                <div class="error-box">
                    <h1>Seite nicht gefunden</h1>
                    <p>Die Ansicht "${pageName}" konnte nicht geladen werden.</p>
                </div>`;
        }
    },

    executeScripts() {
        const scripts = this.contentArea.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');

            // Wir hüllen den Code in einen Block { }, um Variablen-Konflikte zu vermeiden.
            // Zusätzlich fangen wir die requestAnimationFrame ID ab.
            newScript.textContent = `
                {
                    const _raf = window.requestAnimationFrame;
                    window.requestAnimationFrame = (cb) => {
                        const id = _raf(cb);
                        window._currentAppRaf = id;
                        return id;
                    };
                    ${oldScript.textContent}
                }
            `;
            document.body.appendChild(newScript);
            newScript.remove(); // Script-Tag direkt wieder aus DOM löschen
        });
    },

    // "Die Abrissbirne": Löscht alles, was das Dashboard verlangsamen könnte
    destroy() {
        // Stoppe Animationen
        if (window._currentAppRaf) {
            cancelAnimationFrame(window._currentAppRaf);
        }

        // Radikaler Cleanup von Intervallen & Timeouts
        let id = window.setInterval(() => { }, 0);
        while (id--) {
            window.clearInterval(id);
            window.clearTimeout(id);
        }

        // Entferne globale Event-Listener (Standard-Events)
        window.onkeydown = null;
        window.onkeyup = null;
        window.onclick = null;
        window.onresize = null;

        // Optional: Falls du seiten-spezifisches CSS löschen willst
        document.querySelectorAll('.dynamic-style').forEach(s => s.remove());

        // Spezial-Cleanup für Leaflet
        if (window._currentMap) {
            window._currentMap.remove(); // Löscht die Karte sauber aus dem Speicher
            window._currentMap = null;
            console.log("Kernel: Map erfolgreich entfernt.");
        }

        console.log("Kernel: Umgebung bereinigt.");
    },

    async loadExternalResource(url, type) {
        return new Promise((resolve, reject) => {
            // Prüfen, ob Ressource schon existiert
            if (document.querySelector(`[src="${url}"], [href="${url}"]`)) {
                return resolve();
            }

            const element = type === 'script'
                ? document.createElement('script')
                : document.createElement('link');

            if (type === 'script') {
                element.src = url;
            } else {
                element.rel = 'stylesheet';
                element.href = url;
            }

            element.onload = resolve;
            element.onerror = reject;
            document.head.appendChild(element);
        });
    }
};

// Framework starten
Dashboard.init();