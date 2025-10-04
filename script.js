// --- "BANCO DE DADOS" SIMULADO E DADOS DOS MÓDULOS ---
const lunarZones = [
    { id: 1, name: "Cratera Shackleton", solar: 95, water: "A+", terrain: "Estável", details: "Iluminação solar quase constante, ideal para energia. Acesso direto a depósitos de gelo de água." },
    { id: 2, name: "Mar da Serenidade", solar: 60, water: "C-", terrain: "Plano", details: "Terreno extremamente plano e seguro para pousos. Pobre em recursos hídricos." },
    { id: 3, name: "Pico Malapert", solar: 88, water: "B", terrain: "Irregular", details: "Ponto alto com boa iluminação e linha de visão direta com a Terra, excelente para comunicação." },
];

// Centraliza os dados dos módulos para fácil gerenciamento
const moduleData = {
    habitat: { name: 'Habitat', icon: 'fa-house-user' },
    airlock: { name: 'Esclusa', icon: 'fa-door-open' },
    power: { name: 'Energia', icon: 'fa-solar-panel' },
    ltv: { name: 'LTV', icon: 'fa-car-side' },
    isru: { name: 'ISRU', icon: 'fa-industry' },
    'pressurized-rover': { name: 'Rover Pressurizado', icon: 'fa-truck-monster' }
};

// DADOS DO TERRENO COLETADOS PELO ENXAME DE ROVERS
// As coordenadas (x, y) são em porcentagem da área do blueprint.
const terrainData = [
    { type: 'stable', x: 50, y: 50, radius: 40 }, // Uma grande área central estável
    { type: 'solar_hotspot', x: 15, y: 50, radius: 25 }, // Foco de luz solar à esquerda
    { type: 'unstable', x: 90, y: 15, radius: 18 }, // Terreno instável no canto superior direito
    { type: 'water_ice_deposit', x: 85, y: 85, radius: 20 }, // Depósito de gelo no canto inferior direito
];

// --- ESTADO DA APLICAÇÃO ---
let selectedZone = null;
let modulesOnBlueprint = [];
let activeModule = null;
let offsetX, offsetY;

// --- ELEMENTOS DO SITE (DOM) ---
const phase1Container = document.getElementById('phase1-container');
const phase2Container = document.getElementById('phase2-container');
const zoneOptionsContainer = document.querySelector('.zone-options-grid');
const sidePanel = document.getElementById('side-panel');
const blueprintArea = document.getElementById('blueprint-area');
const feedbackPanel = document.getElementById('feedback-panel');
const backToPhase1Btn = document.getElementById('back-to-phase1-btn');

// --- LÓGICA DE NAVEGAÇÃO ---

function goToPhase1() {
    phase2Container.classList.add('hidden');
    phase1Container.classList.remove('hidden');
    resetPhase2();
}

function goToPhase2(zoneId) {
    selectedZone = lunarZones.find(zone => zone.id === zoneId);
    console.log("Zona selecionada:", selectedZone);
    phase1Container.classList.add('hidden');
    phase2Container.classList.remove('hidden');
    provideFeedback();
}

function resetPhase2() {
    // É importante recriar o elemento de info, pois ele é removido
    blueprintArea.innerHTML = '<div id="blueprint-info"> arraste os módulos para cá </div>';
    modulesOnBlueprint = [];
    selectedZone = null;
}


// --- FASE 1: CRIAÇÃO DOS CARTÕES ---

function initializePhase1() {
    zoneOptionsContainer.innerHTML = '';
    lunarZones.forEach(zone => {
        const card = document.createElement('div');
        card.className = 'zone-card';
        card.innerHTML = `
            <h3><i class="fa-solid fa-map-marker-alt"></i> ${zone.name}</h3>
            <ul class="zone-stats">
                <li><strong>Solar:</strong> ${zone.solar}%</li>
                <li><strong>Água:</strong> ${zone.water}</li>
                <li><strong>Terreno:</strong> ${zone.terrain}</li>
            </ul>
            <p class="zone-details">${zone.details}</p>
            <div class="select-zone-btn">Selecionar Zona</div>
        `;
        card.onclick = () => goToPhase2(zone.id);
        zoneOptionsContainer.appendChild(card);
    });
}

// --- FASE 2: LÓGICA DA FERRAMENTA ---

function createModule(type) {
    if (!moduleData[type]) return;

    const blueprintInfo = document.getElementById('blueprint-info');
    if (blueprintInfo) {
        blueprintInfo.style.display = 'none';
    }

    const data = moduleData[type];
    const moduleElement = document.createElement('div');
    moduleElement.className = `module module-${type}`;
    moduleElement.innerHTML = `<i class="fa-solid ${data.icon}"></i><span>${data.name}</span>`;
    moduleElement.dataset.type = type;

    moduleElement.addEventListener('mousedown', startDrag);
    blueprintArea.appendChild(moduleElement);
    
    modulesOnBlueprint.push({ element: moduleElement, type: type });
    provideFeedback();
}

// --- LÓGICA DE DRAG-AND-DROP E COLISÃO ---

function startDrag(event) {
    activeModule = event.currentTarget;
    offsetX = event.clientX - activeModule.getBoundingClientRect().left;
    offsetY = event.clientY - activeModule.getBoundingClientRect().top;
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', stopDrag);
}

function drag(event) {
    if (!activeModule) return;
    event.preventDefault();
    const blueprintRect = blueprintArea.getBoundingClientRect();
    let newX = event.clientX - blueprintRect.left - offsetX;
    let newY = event.clientY - blueprintRect.top - offsetY;

    newX = Math.max(0, Math.min(newX, blueprintRect.width - activeModule.offsetWidth));
    newY = Math.max(0, Math.min(newY, blueprintRect.height - activeModule.offsetHeight));
    
    activeModule.style.left = `${newX}px`;
    activeModule.style.top = `${newY}px`;

    checkAllCollisions();
    provideFeedback(); // Feedback em tempo real sobre o terreno
}

function stopDrag() {
    window.removeEventListener('mousemove', drag);
    window.removeEventListener('mouseup', stopDrag);
    
    checkAllCollisions();
    provideFeedback();
    
    activeModule = null;
}

function checkCollision(moduleA, moduleB) {
    const rectA = moduleA.getBoundingClientRect();
    const rectB = moduleB.getBoundingClientRect();
    return !(rectB.left > rectA.right || 
             rectB.right < rectA.left || 
             rectB.top > rectA.bottom || 
             rectB.bottom < rectA.top);
}

function checkAllCollisions() {
    const allModules = modulesOnBlueprint.map(m => m.element);
    allModules.forEach(m => m.classList.remove('module-colliding'));

    for (let i = 0; i < allModules.length; i++) {
        for (let j = i + 1; j < allModules.length; j++) {
            const moduleA = allModules[i];
            const moduleB = allModules[j];
            if (checkCollision(moduleA, moduleB)) {
                moduleA.classList.add('module-colliding');
                moduleB.classList.add('module-colliding');
            }
        }
    }
}

// --- LÓGICA DE ANÁLISE ESTRATÉGICA ---

function getTerrainInfoForModule(moduleElement) {
    const blueprintRect = blueprintArea.getBoundingClientRect();
    const moduleRect = moduleElement.getBoundingClientRect();
    
    const moduleCenterX = ((moduleRect.left - blueprintRect.left) + (moduleRect.width / 2)) / blueprintRect.width * 100;
    const moduleCenterY = ((moduleRect.top - blueprintRect.top) + (moduleRect.height / 2)) / blueprintRect.height * 100;

    let terrainFeatures = [];

    terrainData.forEach(zone => {
        const distance = Math.sqrt(Math.pow(moduleCenterX - zone.x, 2) + Math.pow(moduleCenterY - zone.y, 2));
        if (distance <= zone.radius) {
            terrainFeatures.push(zone.type);
        }
    });

    if (terrainFeatures.length === 0 || !terrainFeatures.includes('unstable')) {
         if (!terrainFeatures.includes('stable')) terrainFeatures.push('stable');
    }
    
    return terrainFeatures;
}

function provideFeedback() {
    if (!selectedZone) return;

    let feedbackMessages = [];
    const currentModuleTypes = new Set(modulesOnBlueprint.map(m => m.type));

    // 1. VERIFICAÇÃO DE ERROS GERAIS
    if (document.querySelector('.module-colliding')) {
        feedbackMessages.push(`<p class='feedback-danger'><strong>ERRO DE LAYOUT:</strong> Módulos estão sobrepostos! Ajuste a posição.</p>`);
    }
    if (modulesOnBlueprint.length > 0 && !currentModuleTypes.has('power')) {
        feedbackMessages.push(`<p class='feedback-danger'><strong>ALERTA CRÍTICO:</strong> A base não possui uma Usina de Energia.</p>`);
    }
    if (modulesOnBlueprint.length > 0 && !currentModuleTypes.has('habitat')) {
        feedbackMessages.push(`<p class='feedback-danger'><strong>ALERTA CRÍTICO:</strong> A tripulação não tem onde viver. Adicione um Habitat.</p>`);
    }

    // 2. ANÁLISE ESTRATÉGICA POR MÓDULO
    modulesOnBlueprint.forEach(module => {
        const terrainInfo = getTerrainInfoForModule(module.element);
        
        if (terrainInfo.includes('unstable')) {
            feedbackMessages.push(`<p class='feedback-danger'><strong>PERIGO:</strong> O módulo <strong>${moduleData[module.type].name}</strong> está em terreno instável. Risco estrutural elevado!</p>`);
        }
        
        switch (module.type) {
            case 'power':
                if (terrainInfo.includes('solar_hotspot')) {
                    feedbackMessages.push(`<p class='feedback-good'><strong>Status Energia:</strong> Posicionamento excelente! Usina de Energia no foco de luz solar maximiza a geração.</p>`);
                } else {
                    feedbackMessages.push(`<p class='feedback-warn'><strong>Aviso de Energia:</strong> A Usina de Energia não está em um foco de luz solar. A eficiência será reduzida.</p>`);
                }
                break;
            case 'isru':
                if (terrainInfo.includes('water_ice_deposit')) {
                    feedbackMessages.push(`<p class='feedback-good'><strong>Status ISRU:</strong> Posicionamento estratégico! Acesso direto ao depósito de gelo de água.</p>`);
                } else {
                    feedbackMessages.push(`<p class='feedback-warn'><strong>Aviso de ISRU:</strong> A unidade está longe de depósitos de recursos. A extração será ineficiente ou impossível.</p>`);
                }
                break;
            case 'habitat':
                 if (terrainInfo.includes('stable')) {
                    feedbackMessages.push(`<p class='feedback-good'><strong>Status Habitat:</strong> O habitat está em terreno seguro e estável.</p>`);
                }
                break;
        }
    });

    if (feedbackMessages.length > 0) {
        feedbackPanel.innerHTML = `<h3><i class="fa-solid fa-chart-line"></i> Análise de Viabilidade</h3>` + feedbackMessages.join('');
    } else {
        feedbackPanel.innerHTML = `<h3><i class="fa-solid fa-chart-line"></i> Análise de Viabilidade</h3><p>Adicione módulos para iniciar a análise...</p>`;
    }
}

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    initializePhase1();

    sidePanel.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-module]');
        if (button) {
            createModule(button.dataset.module);
        }
    });

    backToPhase1Btn.addEventListener('click', goToPhase1);
});

// --- FUNÇÃO PARA LIMPAR MÓDULOS ---

function clearModules() {
    // 1. Confirmação 
    const confirmClear = confirm("Tem certeza que deseja limpar todos os módulos do layout? Esta ação não pode ser desfeita.");

    if (!confirmClear) {
        return; // Sai da função se o usuário clicar em Cancelar
    }
    
    // 2. Limpa a área visual do blueprint, voltando para o texto de info
    blueprintArea.innerHTML = '<div id="blueprint-info"> arraste os módulos para cá </div>';
    
    // 3. Limpa o estado da aplicação
    modulesOnBlueprint = [];
    
    // 4. Atualiza o painel de feedback
    provideFeedback();
}

// --- CONFIGURAÇÃO DO BOTÃO DE LIMPEZA ---
document.addEventListener('DOMContentLoaded', () => {
    // ... (Seus listeners existentes) ...

    const clearModulesBtn = document.getElementById('back-to-phase2-btn');
    if (clearModulesBtn) {
        clearModulesBtn.addEventListener('click', clearModules);
    }
});