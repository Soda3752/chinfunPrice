// ========== TAB SWITCHING ==========
function switchTab(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(pageName + '-page').classList.add('active');
    document.querySelector('[data-page="' + pageName + '"]').classList.add('active');
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.page));
});

// ========== NOTICE PAGE JS ==========
let activeSection = null;
const FULL_EDIT_SELECTORS = ['.card-title', 'p.body-text', 'p.footer-message', '.company-info'];

function toggleEditMode() {
    const noticePage = document.getElementById('notice-page');
    if (noticePage.classList.contains('edit-mode')) {
        exitEditMode();
    } else {
        enterEditMode();
    }
}

function enterEditMode() {
    const noticePage = document.getElementById('notice-page');
    noticePage.classList.add('edit-mode');
    const btn = document.getElementById('editModeBtn');
    btn.classList.add('active');
    btn.textContent = '✕ 結束編輯';

    FULL_EDIT_SELECTORS.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => addPencilTo(el, el));
    });
}

function addPencilTo(container, targetEl) {
    container.style.position = 'relative';
    const btn = document.createElement('button');
    btn.className = 'pencil-btn';
    btn.innerHTML = '✏';
    btn.title = '編輯此區段';
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => startEditing(targetEl, btn));
    targetEl._pencilBtn = btn;
    container.appendChild(btn);
}

function exitEditMode() {
    if (activeSection) doneEditing();

    const noticePage = document.getElementById('notice-page');
    noticePage.classList.remove('edit-mode');
    const btn = document.getElementById('editModeBtn');
    btn.classList.remove('active');
    btn.textContent = '✏ 編輯';

    document.querySelectorAll('.pencil-btn').forEach(b => b.remove());

    FULL_EDIT_SELECTORS.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            el.style.position = '';
            delete el._pencilBtn;
        });
    });

    saveNoticeToStorage();
}

function startEditing(section, pencilBtn) {
    if (activeSection === section) return;
    if (activeSection) doneEditing();

    activeSection = section;
    section.contentEditable = 'true';
    section.classList.add('editing-active');
    section.focus();

    const pb = pencilBtn || section._pencilBtn;
    if (pb) pb.style.visibility = 'hidden';

    document.getElementById('highlightToolbar').classList.add('visible');
}

function doneEditing() {
    if (!activeSection) return;

    activeSection.removeAttribute('contenteditable');
    activeSection.classList.remove('editing-active');

    const pb = activeSection._pencilBtn;
    if (pb) pb.style.visibility = '';

    activeSection = null;
    document.getElementById('highlightToolbar').classList.remove('visible');
}

function applyHighlight(color) {
    if (!activeSection) return;
    activeSection.focus();
    document.execCommand('hiliteColor', false, color);
}

function removeHighlight() {
    if (!activeSection) return;
    activeSection.focus();
    document.execCommand('hiliteColor', false, 'transparent');
}

function createPriceRow(label, price, unit) {
    const row = document.createElement('div');
    row.className = 'price-row';

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.className = 'price-label-input';
    labelInput.placeholder = '品項名稱';
    labelInput.maxLength = 8;
    labelInput.value = label || '';

    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.className = 'price-input';
    priceInput.value = price || '0';
    priceInput.min = '0';

    const unitSpan = document.createElement('span');
    unitSpan.className = 'price-unit';
    unitSpan.textContent = '元/';

    const unitInput = document.createElement('input');
    unitInput.type = 'text';
    unitInput.className = 'price-unit-input';
    unitInput.placeholder = '單位';
    unitInput.maxLength = 4;
    unitInput.value = unit || '';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-row-btn';
    deleteBtn.innerHTML = '✕';
    deleteBtn.title = '刪除此品項';
    deleteBtn.onclick = () => {
        row.remove();
        saveNoticeToStorage();
    };

    row.appendChild(labelInput);
    row.appendChild(priceInput);
    row.appendChild(unitSpan);
    row.appendChild(unitInput);
    row.appendChild(deleteBtn);
    return row;
}

function addPriceRow() {
    const table = document.querySelector('.price-table');
    const addBtn = table.querySelector('.add-row-btn');
    const row = createPriceRow('', '0', '');
    table.insertBefore(row, addBtn);
    row.querySelector('.price-label-input').focus();
}

// ===== Notice localStorage =====
const NOTICE_STORAGE_KEY = 'priceNotice_v1';

const NOTICE_DEFAULTS = {
    title: '價格調整通知',
    bodyTexts: [
        '親愛的顧客，您好：',
        '感謝您一直以來對本公司的信任與支持。',
        '由於近期麵粉、奶油等主要原物料成本大幅上漲，加上運輸及人力成本增加，為維持產品品質與服務水準，本公司秉持回饋顧客精神，已<span class="highlight-yellow">一年未調整價格</span>。為持續提供優質產品與服務，將自<span class="highlight-yellow">2026年3月1日</span>起調整部分商品價格：'
    ],
    footerMessage: '再次感謝您的理解與支持，敬祝身體健康，事業順利！',
    companyInfo: '<div>青坊食品有限公司</div><div>04-7359885</div><div>2025/7/17</div>',
    priceRows: [
        {label: '吐司類調漲', price: '0', unit: '條'},
        {label: '漢堡類調漲', price: '0', unit: '個'}
    ],
    cardWidth: 480
};

function resetNoticeToDefault() {
    if (!confirm('確定要還原為預設內容嗎？目前的所有編輯將會清除。')) return;

    if (document.getElementById('notice-page').classList.contains('edit-mode')) exitEditMode();

    localStorage.removeItem(NOTICE_STORAGE_KEY);

    document.querySelector('.card-title').innerHTML = NOTICE_DEFAULTS.title;
    const bodyEls = document.querySelectorAll('p.body-text');
    NOTICE_DEFAULTS.bodyTexts.forEach((html, i) => {
        if (bodyEls[i]) bodyEls[i].innerHTML = html;
    });
    document.querySelector('p.footer-message').innerHTML = NOTICE_DEFAULTS.footerMessage;
    document.querySelector('.company-info').innerHTML = NOTICE_DEFAULTS.companyInfo;

    const table = document.querySelector('.price-table');
    const addBtn = table.querySelector('.add-row-btn');
    table.querySelectorAll('.price-row').forEach(r => r.remove());
    NOTICE_DEFAULTS.priceRows.forEach(rd => table.insertBefore(createPriceRow(rd.label, rd.price, rd.unit), addBtn));

    const w = NOTICE_DEFAULTS.cardWidth;
    document.querySelector('.notice-card').style.width = w + 'px';
    document.getElementById('widthSlider').value = w;
    document.getElementById('widthValue').textContent = w;
}

function saveNoticeToStorage() {
    const data = {
        title: document.querySelector('.card-title').innerHTML,
        bodyTexts: Array.from(document.querySelectorAll('p.body-text')).map(el => el.innerHTML),
        footerMessage: document.querySelector('p.footer-message').innerHTML,
        companyInfo: document.querySelector('.company-info').innerHTML,
        priceRows: Array.from(document.querySelectorAll('.price-row')).map(row => ({
            label: row.querySelector('.price-label-input')?.value || '',
            price: row.querySelector('.price-input')?.value || '0',
            unit: row.querySelector('.price-unit-input')?.value || ''
        })),
        cardWidth: document.querySelector('.notice-card').style.width || '480px'
    };
    localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(data));
}

function loadNoticeFromStorage() {
    const raw = localStorage.getItem(NOTICE_STORAGE_KEY);
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        if (data.title) document.querySelector('.card-title').innerHTML = data.title;
        if (data.bodyTexts) {
            const els = document.querySelectorAll('p.body-text');
            data.bodyTexts.forEach((html, i) => {
                if (els[i]) els[i].innerHTML = html;
            });
        }
        if (data.footerMessage) document.querySelector('p.footer-message').innerHTML = data.footerMessage;
        if (data.companyInfo) document.querySelector('.company-info').innerHTML = data.companyInfo;
        if (data.priceRows) {
            const table = document.querySelector('.price-table');
            const addBtn = table.querySelector('.add-row-btn');
            table.querySelectorAll('.price-row').forEach(r => r.remove());
            data.priceRows.forEach(rd => {
                table.insertBefore(createPriceRow(rd.label, rd.price, rd.unit), addBtn);
            });
        }
        if (data.cardWidth) {
            const w = parseInt(data.cardWidth);
            document.querySelector('.notice-card').style.width = w + 'px';
            document.getElementById('widthSlider').value = w;
            document.getElementById('widthValue').textContent = w;
        }
    } catch (e) {
        console.warn('載入快取失敗', e);
    }
}

document.querySelector('.price-table').addEventListener('input', saveNoticeToStorage);

const widthSlider = document.getElementById('widthSlider');
const widthValueEl = document.getElementById('widthValue');
const noticeCard = document.querySelector('.notice-card');

widthSlider.addEventListener('input', function () {
    noticeCard.style.width = this.value + 'px';
    widthValueEl.textContent = this.value;
    saveNoticeToStorage();
});

window.addEventListener('load', function () {
    loadNoticeFromStorage();
    loadViewerDataFromStorage();
});

document.addEventListener('click', function (e) {
    if (!activeSection) return;
    if (activeSection.contains(e.target)) return;
    if (document.getElementById('highlightToolbar').contains(e.target)) return;
    if (e.target.id === 'editModeBtn') return;
    doneEditing();
});

// ========== VIEWER PAGE JS ==========
var allRoutes = {};
var allItems = [];
var currentRoute = '';
var newPrices = {};
var _filesProcessed = 0;
var _totalFiles = 0;
var VIEWER_STORAGE_KEY = 'qingfang_new_prices';
var VIEWER_DATA_KEY = 'qingfang_viewer_data';

function priceClass(p) {
    if (p >= 30) return 'p-green';
    if (p >= 10) return 'p-blue';
    return 'p-amber';
}

function npKey(custId, item) {
    return custId + '__' + item;
}

function saveViewerToStorage() {
    try {
        localStorage.setItem(VIEWER_STORAGE_KEY, JSON.stringify(newPrices));
    } catch (e) {
    }
}

function loadViewerFromStorage() {
    try {
        var d = localStorage.getItem(VIEWER_STORAGE_KEY);
        if (d) newPrices = JSON.parse(d);
    } catch (e) {
    }
}

function clearViewerData() {
    if (!confirm('確定要清除所有客戶資料與新單價嗎？')) return;

    localStorage.removeItem(VIEWER_DATA_KEY);
    localStorage.removeItem(VIEWER_STORAGE_KEY);

    allRoutes = {};
    allItems = [];
    currentRoute = '';
    newPrices = {};

    document.getElementById('data-section').classList.add('hidden');
    document.getElementById('upload-section').classList.remove('hidden');
    document.getElementById('reupload-btn').classList.add('hidden');
    document.getElementById('export-btn').classList.add('hidden');
    document.getElementById('screenshot-btn').classList.add('hidden');
    document.getElementById('clear-viewer-btn').classList.add('hidden');
    document.getElementById('header-sub').textContent = '請上傳帳單 Excel 檔案';
    document.getElementById('changed-chip').classList.add('hidden');
}

function saveViewerDataToStorage() {
    try {
        localStorage.setItem(VIEWER_DATA_KEY, JSON.stringify({routes: allRoutes, items: allItems}));
    } catch (e) {
        console.warn('儲存客戶資料失敗（可能超過 localStorage 容量）', e);
    }
}

function loadViewerDataFromStorage() {
    try {
        var raw = localStorage.getItem(VIEWER_DATA_KEY);
        if (!raw) return;
        var data = JSON.parse(raw);
        if (!data.routes || !Object.keys(data.routes).length) return;
        allRoutes = data.routes;
        allItems = data.items || [];
        currentRoute = Object.keys(allRoutes)[0];
        loadViewerFromStorage();

        var routeNames = Object.keys(allRoutes);
        var totalC = 0;
        routeNames.forEach(function (r) {
            totalC += allRoutes[r].length;
        });
        document.getElementById('header-sub').textContent =
            routeNames.length + ' 條路線 · ' + totalC + ' 位客戶 · ' + allItems.length + ' 種品項';

        buildRouteTabs();
        renderCards();
        document.getElementById('upload-section').classList.add('hidden');
        document.getElementById('data-section').classList.remove('hidden');
        document.getElementById('reupload-btn').classList.remove('hidden');
        document.getElementById('export-btn').classList.remove('hidden');
        document.getElementById('screenshot-btn').classList.remove('hidden');
        document.getElementById('clear-viewer-btn').classList.remove('hidden');
        updateChangedChip();
    } catch (e) {
        console.warn('載入客戶資料失敗', e);
    }
}

function parseSheet(sheet) {
    var data = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ''});
    var customers = [];
    var i = 0;

    while (i < data.length) {
        var row = data[i];
        var firstCell = String(row[0] || '').trim();

        if (firstCell === '\u5ba2\u6236\u7de8\u865f' || firstCell.indexOf('\u5ba2\u6236\u7de8\u865f') === 0) {
            var custId = '';
            for (var c = 1; c < row.length; c++) {
                if (row[c] !== '') {
                    custId = String(row[c]).trim();
                    break;
                }
            }

            var custName = '';
            if (i + 1 < data.length) {
                var nr = data[i + 1];
                for (var c2 = 1; c2 < nr.length; c2++) {
                    var v = String(nr[c2] || '').trim();
                    if (v && v !== '\u5ba2\u6236\u540d\u7a31') {
                        custName = v;
                        break;
                    }
                }
            }

            var unitPriceCol = -1;
            var headerRowIdx = -1;
            for (var h = i + 2; h < Math.min(i + 6, data.length); h++) {
                var hr = data[h];
                for (var hc = 0; hc < hr.length; hc++) {
                    if (String(hr[hc] || '').trim() === '\u55ae\u50f9') {
                        unitPriceCol = hc;
                        headerRowIdx = h;
                        break;
                    }
                }
                if (headerRowIdx >= 0) break;
            }

            if (headerRowIdx < 0 || unitPriceCol < 0) {
                i++;
                continue;
            }

            var prices = {};
            var j = headerRowIdx + 1;
            while (j < data.length) {
                var ir = data[j];
                var itemName = String(ir[0] || '').trim();
                if (!itemName) {
                    j++;
                    break;
                }
                if (itemName === '\u5ba2\u6236\u7de8\u865f') break;
                if (itemName.indexOf('\u7e3d\u8a08') >= 0) {
                    j++;
                    break;
                }
                var price = parseFloat(ir[unitPriceCol]);
                if (!isNaN(price) && price > 0) prices[itemName] = price;
                j++;
            }
            i = j;

            if (custName && Object.keys(prices).length > 0) {
                customers.push({id: custId, name: custName, prices: prices});
            }
        } else {
            i++;
        }
    }
    return customers;
}

function processFiles(files) {
    allRoutes = {};
    allItems = [];
    _filesProcessed = 0;
    _totalFiles = files.length;

    for (var fi = 0; fi < files.length; fi++) {
        (function (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var wb = XLSX.read(e.target.result, {type: 'array'});
                for (var si = 0; si < wb.SheetNames.length; si++) {
                    var sheetName = wb.SheetNames[si];
                    var custs = parseSheet(wb.Sheets[sheetName]);
                    if (!custs.length) continue;
                    var route = (sheetName !== 'Sheet1' && sheetName !== 'Sheet2')
                        ? sheetName : file.name.replace(/\.[^.]+$/, '');
                    if (!allRoutes[route]) allRoutes[route] = [];
                    allRoutes[route] = allRoutes[route].concat(custs);
                }
                _filesProcessed++;
                if (_filesProcessed >= _totalFiles) finalizeRender();
            };
            reader.readAsArrayBuffer(file);
        })(files[fi]);
    }
}

function finalizeRender() {
    var seen = {};
    var order = [];
    Object.keys(allRoutes).forEach(function (r) {
        allRoutes[r].forEach(function (c) {
            Object.keys(c.prices).forEach(function (it) {
                if (!seen[it]) {
                    seen[it] = true;
                    order.push(it);
                }
            });
        });
    });
    allItems = order;

    var routeNames = Object.keys(allRoutes);
    if (!routeNames.length) {
        alert('\u627e\u4e0d\u5230\u53ef\u89e3\u6790\u7684\u5ba2\u6236\u8cc7\u6599\uff0c\u8acb\u78ba\u8a8d\u683c\u5f0f\u3002');
        return;
    }
    currentRoute = routeNames[0];

    loadViewerFromStorage();

    var totalC = 0;
    Object.keys(allRoutes).forEach(function (r) {
        totalC += allRoutes[r].length;
    });
    document.getElementById('header-sub').textContent =
        routeNames.length + ' \u689d\u8def\u7dda \u00b7 ' + totalC + ' \u4f4d\u5ba2\u6236 \u00b7 ' + allItems.length + ' \u7a2e\u54c1\u9805';

    buildRouteTabs();
    renderCards();
    document.getElementById('upload-section').classList.add('hidden');
    document.getElementById('data-section').classList.remove('hidden');
    document.getElementById('reupload-btn').classList.remove('hidden');
    document.getElementById('export-btn').classList.remove('hidden');
    document.getElementById('screenshot-btn').classList.remove('hidden');
    document.getElementById('clear-viewer-btn').classList.remove('hidden');
    updateChangedChip();
    saveViewerDataToStorage();
}

function buildRouteTabs() {
    var container = document.getElementById('route-tabs');
    container.innerHTML = '';
    Object.keys(allRoutes).forEach(function (r) {
        var div = document.createElement('div');
        div.className = 'rtab' + (r === currentRoute ? ' active' : '');
        div.innerHTML = r + '<span class="rtab-count">' + allRoutes[r].length + '</span>';
        div.addEventListener('click', (function (route) {
            return function () {
                switchRoute(route);
            };
        })(r));
        container.appendChild(div);
    });
}

function switchRoute(r) {
    currentRoute = r;
    document.getElementById('search').value = '';
    buildRouteTabs();
    renderCards();
}

function updateChangedChip() {
    var count = Object.keys(newPrices).length;
    var chip = document.getElementById('changed-chip');
    if (count > 0) {
        chip.textContent = '\u5df2\u4fee\u6539 ' + count + ' \u7b46';
        chip.classList.remove('hidden');
    } else {
        chip.classList.add('hidden');
    }
}

function renderCards() {
    var q = document.getElementById('search').value.trim().toLowerCase();
    var route = allRoutes[currentRoute] || [];
    var customers = [];
    for (var i = 0; i < route.length; i++) {
        var c = route[i];
        if (!q || c.name.indexOf(q) >= 0 || c.id.toLowerCase().indexOf(q) >= 0) {
            customers.push(c);
        }
    }

    var grid = document.getElementById('cards-grid');

    if (!customers.length) {
        grid.innerHTML = '<div class="no-results">\u627e\u4e0d\u5230\u7b26\u5408\u300c' + q + '\u300d\u7684\u5ba2\u6236</div>';
    } else {
        var html = '';
        for (var ci = 0; ci < customers.length; ci++) {
            var c = customers[ci];
            var rows = '';
            var items = Object.keys(c.prices);
            for (var ii = 0; ii < items.length; ii++) {
                var item = items[ii];
                var price = c.prices[item];
                var key = npKey(c.id, item);
                var saved = newPrices[key];
                var hasVal = saved != null;
                rows += '<tr>'
                    + '<td>' + item + '</td>'
                    + '<td class="right"><span class="price ' + priceClass(price) + '">' + price + '</span></td>'
                    + '<td class="right">'
                    + '<span class="arrow-icon">&rarr;</span>'
                    + '<input class="new-price-input' + (hasVal ? ' has-value' : '') + '"'
                    + ' type="number" step="0.5" min="0"'
                    + ' data-key="' + key + '"'
                    + ' placeholder="\u65b0\u55ae\u50f9"'
                    + ' value="' + (hasVal ? saved : '') + '"'
                    + ' oninput="onNewPriceInput(this.getAttribute(\'data-cid\'), this.getAttribute(\'data-item\'), this.value)"'
                    + ' data-cid="' + c.id + '"'
                    + ' data-item="' + item.replace(/"/g, '&quot;') + '"'
                    + '>'
                    + '</td>'
                    + '</tr>';
            }

            html += '<div class="customer-card">'
                + '<div class="card-header">'
                + '<span class="card-name">' + c.name + '</span>'
                + '<span class="card-id">#' + c.id + '</span>'
                + '</div>'
                + '<table class="card-table">'
                + '<thead><tr>'
                + '<th>\u54c1\u9805</th>'
                + '<th class="right">\u73fe\u884c\u55ae\u50f9</th>'
                + '<th class="right">\u65b0\u55ae\u50f9 (NT$)</th>'
                + '</tr></thead>'
                + '<tbody>' + rows + '</tbody>'
                + '</table>'
                + '</div>';
        }
        grid.innerHTML = html;
    }

    var total = (allRoutes[currentRoute] || []).length;
    document.getElementById('stat-customers').textContent = customers.length + ' \u4f4d\u5ba2\u6236';
    document.getElementById('stat-items').textContent = allItems.length + ' \u7a2e\u54c1\u9805';
    document.getElementById('status-bar').textContent =
        '\u986f\u793a ' + customers.length + ' / ' + total + ' \u4f4d\u5ba2\u6236\u3000\u00b7\u3000\u6a58\u8272\u8868\u793a\u5df2\u586b\u5165\u65b0\u55ae\u50f9';
}

function onNewPriceInput(custId, item, val) {
    var key = npKey(custId, item);
    var v = String(val).trim();
    if (v === '' || isNaN(parseFloat(v))) {
        delete newPrices[key];
    } else {
        newPrices[key] = parseFloat(v);
    }
    saveViewerToStorage();
    updateChangedChip();
    var inputs = document.querySelectorAll('.new-price-input');
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].getAttribute('data-key') === key) {
            if (newPrices[key] != null) inputs[i].classList.add('has-value');
            else inputs[i].classList.remove('has-value');
            break;
        }
    }
}

async function exportExcel() {
    var COLS_PER_STORE = 4; // 品項, 現行單價, 新單價, 漲幅
    var STORES_PER_ROW = 5;

    var THIN_BORDER = {
        top: {style: 'thin'},
        left: {style: 'thin'},
        bottom: {style: 'thin'},
        right: {style: 'thin'}
    };

    // 每家店三層底色：店名列 / 標題列 / 資料列
    var STORE_COLORS = [
        {name: 'FF81C784', header: 'FFA5D6A7', data: 'FFE8F5E9'}, // 綠
        {name: 'FF64B5F6', header: 'FF90CAF9', data: 'FFE3F2FD'}, // 藍
        {name: 'FFFFB74D', header: 'FFFFCC80', data: 'FFFFF3E0'}, // 橙
        {name: 'FFEF9A9A', header: 'FFFFC8C8', data: 'FFFFF0F0'}, // 玫瑰
        {name: 'FFCE93D8', header: 'FFE1BEE7', data: 'FFF3E5F5'}, // 紫
    ];

    var workbook = new ExcelJS.Workbook();
    Object.keys(allRoutes).forEach(function (routeName) {
        var customers = allRoutes[routeName];
        var sheet = workbook.addWorksheet(routeName.slice(0, 31));

        // 欄寬：每家店重複 4 欄
        var colDefs = [];
        for (var k = 0; k < STORES_PER_ROW; k++) {
            colDefs.push({width: 16}); // 品項
            colDefs.push({width: 11}); // 現行單價
            colDefs.push({width: 11}); // 新單價
            colDefs.push({width: 9}); // 漲幅
        }
        sheet.columns = colDefs;

        for (var i = 0; i < customers.length; i += STORES_PER_ROW) {
            var group = customers.slice(i, i + STORES_PER_ROW);

            // ── 店名列（merge 橫跨 4 欄）──
            var nameArr = new Array(STORES_PER_ROW * COLS_PER_STORE).fill('');
            group.forEach(function (c, idx) {
                nameArr[idx * COLS_PER_STORE] = c.name + ' #' + c.id;
            });
            var nameRow = sheet.addRow(nameArr);
            nameRow.height = 20;
            group.forEach(function (c, idx) {
                var colStart = idx * COLS_PER_STORE + 1;
                sheet.mergeCells(nameRow.number, colStart, nameRow.number, colStart + COLS_PER_STORE - 1);
                var cell = nameRow.getCell(colStart);
                cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: STORE_COLORS[idx % 5].name}};
                cell.font = {bold: true, size: 11};
                cell.alignment = {horizontal: 'center', vertical: 'middle'};
                cell.border = THIN_BORDER;
            });

            // ── 欄位標題列 ──
            var headerArr = new Array(STORES_PER_ROW * COLS_PER_STORE).fill('');
            group.forEach(function (c, idx) {
                var base = idx * COLS_PER_STORE;
                headerArr[base] = '品項';
                headerArr[base + 1] = '現行單價';
                headerArr[base + 2] = '新單價';
                headerArr[base + 3] = '漲幅';
            });
            var headerRow = sheet.addRow(headerArr);
            group.forEach(function (c, idx) {
                var colStart = idx * COLS_PER_STORE + 1;
                for (var p = 0; p < COLS_PER_STORE; p++) {
                    var cell = headerRow.getCell(colStart + p);
                    cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: STORE_COLORS[idx % 5].header}};
                    cell.font = {bold: true};
                    cell.alignment = {horizontal: p === 0 ? 'left' : 'center'};
                    cell.border = THIN_BORDER;
                }
            });

            // ── 品項資料列 ──
            var maxItems = 0;
            group.forEach(function (c) {
                var cnt = Object.keys(c.prices).length;
                if (cnt > maxItems) maxItems = cnt;
            });

            for (var j = 0; j < maxItems; j++) {
                var itemArr = new Array(STORES_PER_ROW * COLS_PER_STORE).fill('');
                group.forEach(function (c, idx) {
                    var items = Object.keys(c.prices);
                    if (j < items.length) {
                        var item = items[j];
                        var key = npKey(c.id, item);
                        var oldP = c.prices[item];
                        var np = newPrices[key] != null ? newPrices[key] : '';
                        var diff = np !== '' ? (np - oldP) : '';
                        var base = idx * COLS_PER_STORE;
                        itemArr[base] = item;
                        itemArr[base + 1] = oldP;
                        itemArr[base + 2] = np;
                        itemArr[base + 3] = diff;
                    }
                });
                var dataRow = sheet.addRow(itemArr);
                group.forEach(function (c, idx) {
                    var colStart = idx * COLS_PER_STORE + 1;
                    for (var p = 0; p < COLS_PER_STORE; p++) {
                        var dc = dataRow.getCell(colStart + p);
                        dc.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: STORE_COLORS[idx % 5].data}};
                        dc.border = THIN_BORDER;
                    }
                });
            }

            // 組間空白列
            sheet.addRow([]);
        }
    });

    // 下載檔案
    var buffer = await workbook.xlsx.writeBuffer();
    var blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var today = new Date();
    var ds = today.getFullYear()
        + String(today.getMonth() + 1).padStart(2, '0')
        + String(today.getDate()).padStart(2, '0');
    a.href = url;
    a.download = '\u55ae\u50f9\u8abf\u6574_' + ds + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function captureRouteScreenshot() {
    var btn = document.getElementById('screenshot-btn');
    var prevSearch = document.getElementById('search').value;

    // 暫時清除搜尋、顯示全部卡片
    document.getElementById('search').value = '';
    renderCards();

    btn.disabled = true;
    btn.textContent = '處理中…';

    var grid = document.getElementById('cards-grid');

    // 將 input 換成外觀一致的 span，避免截圖破版
    var replaced = [];
    grid.querySelectorAll('.new-price-input').forEach(function (input) {
        var hasVal = input.classList.contains('has-value');
        var span = document.createElement('span');
        span.className = 'new-price-input' + (hasVal ? ' has-value' : '');
        span.style.display = 'inline-block';
        span.style.lineHeight = '1.6';
        span.textContent = hasVal ? input.value : '新單價';
        if (!hasVal) span.style.color = '#a09d96';
        input.parentNode.replaceChild(span, input);
        replaced.push({span: span, input: input});
    });

    function restore() {
        replaced.forEach(function (r) {
            r.span.parentNode.replaceChild(r.input, r.span);
        });
        document.getElementById('search').value = prevSearch;
        renderCards();
        btn.disabled = false;
        btn.textContent = '📷 截圖';
    }

    html2canvas(grid, {
        backgroundColor: '#f5f0e8',
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        width: grid.scrollWidth,
        height: grid.scrollHeight,
        windowWidth: grid.scrollWidth
    }).then(function (canvas) {
        var today = new Date();
        var ds = today.getFullYear()
            + String(today.getMonth() + 1).padStart(2, '0')
            + String(today.getDate()).padStart(2, '0');
        var link = document.createElement('a');
        link.download = currentRoute + '_客戶單價_' + ds + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        restore();
    }, function () {
        restore();
    });
}

document.getElementById('file-input').addEventListener('change', function (e) {
    processFiles(e.target.files);
});
document.getElementById('file-input2').addEventListener('change', function (e) {
    document.getElementById('data-section').classList.add('hidden');
    document.getElementById('upload-section').classList.remove('hidden');
    processFiles(e.target.files);
});

var dz = document.getElementById('drop-zone');
dz.addEventListener('dragover', function (e) {
    e.preventDefault();
    dz.classList.add('dragover');
});
dz.addEventListener('dragleave', function () {
    dz.classList.remove('dragover');
});
dz.addEventListener('drop', function (e) {
    e.preventDefault();
    dz.classList.remove('dragover');
    processFiles(e.dataTransfer.files);
});
