const state = {
  category: "All",
  subcategory: "All",
  query: "",
  availableOnly: false
};

let equipment = [];

const subcategoryLabels = {
  Microphones: "MICROPHONES / 麦克风",
  Drums: "DRUMS / 鼓组",
  Keys: "KEYS / 键盘乐器",
  "Guitars & Basses": "GUITARS & BASSES / 吉他与贝斯",
  "Guitar Amps": "GUITAR AMPS / 吉他音箱",
  "Bass Amps": "BASS AMPS / 贝斯音箱",
  Percussion: "PERCUSSION / 打击乐器",
  Instruments: "INSTRUMENTS / 其他乐器"
};

const elements = {};

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textValue(value) {
  return String(value ?? "").trim();
}

function isAvailable(item) {
  return Number(item.available || 0) > 0;
}

function searchableText(item) {
  const childNames = Array.isArray(item.children)
    ? item.children.map((child) => child.name).join(" ")
    : "";

  return [
    item.model,
    item.manufacturer,
    item.category,
    item.subcategory,
    item.type,
    item.polarPattern,
    item.color,
    childNames
  ]
    .map(textValue)
    .join(" ")
    .toLowerCase();
}

function getFilteredEquipment() {
  return equipment.filter((item) => {
    const categoryMatches =
      state.category === "All" || item.category === state.category;

    const subcategoryMatches =
      state.subcategory === "All" ||
      item.subcategory === state.subcategory;

    const availabilityMatches =
      !state.availableOnly || isAvailable(item);

    const searchMatches =
      !state.query || searchableText(item).includes(state.query);

    return (
      categoryMatches &&
      subcategoryMatches &&
      availabilityMatches &&
      searchMatches
    );
  });
}

function renderSubcategories() {
  const source = equipment.filter(
    (item) => state.category === "All" || item.category === state.category
  );

  const subcategories = [
    ...new Set(source.map((item) => item.subcategory).filter(Boolean))
  ].sort((a, b) => a.localeCompare(b));

  if (
    state.subcategory !== "All" &&
    !subcategories.includes(state.subcategory)
  ) {
    state.subcategory = "All";
  }

  elements.subcategories.innerHTML = ["All", ...subcategories]
    .map((subcategory) => {
      const label =
        subcategory === "All"
          ? "ALL TYPES / 全部类型"
          : subcategoryLabels[subcategory] || escapeHTML(subcategory);

      const active = state.subcategory === subcategory;

      return `
        <button
          class="subcategory-button${active ? " active" : ""}"
          type="button"
          data-subcategory="${escapeHTML(subcategory)}"
          aria-pressed="${active}"
        >${label}</button>
      `;
    })
    .join("");
}

function detailPills(item) {
  const details = [];

  if (item.subcategory) details.push(item.subcategory);
  if (item.type) details.push(item.type);
  if (item.polarPattern) details.push(item.polarPattern);
  if (item.color) details.push(item.color);

  return details
    .filter(Boolean)
    .map((detail) => `<span class="detail-pill">${escapeHTML(detail)}</span>`)
    .join("");
}

function childDimensions(child) {
  const size = textValue(child.size);
  const depth = textValue(child.depth);

  if (size && depth) return `${escapeHTML(size)} × ${escapeHTML(depth)}`;
  if (size) return escapeHTML(size);
  if (depth) return escapeHTML(depth);
  return "—";
}

function renderConfiguration(children, configurationId) {
  if (!Array.isArray(children) || children.length === 0) return "";

  const rows = children
    .map((child) => {
      const available = Boolean(child.available);

      return `
        <div class="configuration-item">
          <div>${escapeHTML(child.name || "Unnamed component")}</div>
          <div>${childDimensions(child)}</div>
          <div class="child-status">
            ${available ? "Available / 可用" : "Unavailable / 暂不可用"}
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="configuration" id="${configurationId}">
      <div class="configuration-header">
        <span>Component / 部件</span>
        <span>Configuration / 配置</span>
      </div>
      ${rows}
    </div>
  `;
}

function renderEquipmentItem(item, index) {
  const available = isAvailable(item);
  const total = Number(item.total || 0);
  const availableCount = Number(item.available || 0);
  const children = Array.isArray(item.children) ? item.children : [];
  const configurationId = `configuration-${index}`;

  return `
    <article class="equipment-item">
      <div class="equipment-main">
        <div class="equipment-index">${String(index + 1).padStart(2, "0")}</div>

        <div class="equipment-identity">
          <div class="equipment-brand">
            ${escapeHTML(item.manufacturer || "Cashmere Collection")}
          </div>
          <div class="detail-pill">${escapeHTML(item.category || "Equipment")}</div>
        </div>

        <div class="equipment-content">
          <h2 class="equipment-model">${escapeHTML(item.model || "Untitled")}</h2>
          <div class="equipment-details">${detailPills(item)}</div>
        </div>

        <div class="equipment-status">
          <div class="availability${available ? " available" : ""}">
            <span class="availability-dot" aria-hidden="true"></span>
            <span>${available ? "Available / 可用" : "Unavailable / 暂不可用"}</span>
          </div>

          <div class="availability-count">
            ${availableCount} / ${total} available
          </div>

          ${
            children.length
              ? `
                <button
                  class="configuration-button"
                  type="button"
                  data-target="${configurationId}"
                  aria-expanded="false"
                >View configuration + / 查看配置</button>
              `
              : ""
          }
        </div>
      </div>

      ${renderConfiguration(children, configurationId)}
    </article>
  `;
}

function renderEquipment() {
  const filtered = getFilteredEquipment();

  elements.resultCount.textContent =
    `${filtered.length} MODELS SHOWN / 显示 ${filtered.length} 项设备`;

  if (!filtered.length) {
    elements.list.innerHTML = `
      <div class="empty-state">
        No matching equipment found.<br>
        未找到符合条件的设备。
      </div>
    `;
    return;
  }

  elements.list.innerHTML = filtered
    .map((item, index) => renderEquipmentItem(item, index))
    .join("");
}

function updateCategoryButtons() {
  document.querySelectorAll(".filter-button").forEach((button) => {
    const active = button.dataset.category === state.category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function updateOverview() {
  const availableUnits = equipment.reduce(
    (sum, item) => sum + Number(item.available || 0),
    0
  );

  elements.totalModels.textContent = equipment.length;
  elements.availableUnits.textContent = availableUnits;
}

function bindEvents() {
  document.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      state.subcategory = "All";
      updateCategoryButtons();
      renderSubcategories();
      renderEquipment();
    });
  });

  elements.subcategories.addEventListener("click", (event) => {
    const button = event.target.closest("[data-subcategory]");
    if (!button) return;

    state.subcategory = button.dataset.subcategory;
    renderSubcategories();
    renderEquipment();
  });

  elements.search.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderEquipment();
  });

  elements.availableOnly.addEventListener("change", (event) => {
    state.availableOnly = event.target.checked;
    renderEquipment();
  });

  elements.list.addEventListener("click", (event) => {
    const button = event.target.closest(".configuration-button");
    if (!button) return;

    const configuration = document.getElementById(button.dataset.target);
    const isOpen = configuration.classList.toggle("open");

    button.setAttribute("aria-expanded", String(isOpen));
    button.textContent = isOpen
      ? "Close configuration − / 收起配置"
      : "View configuration + / 查看配置";
  });
}

async function loadEquipment() {
  try {
    const response = await fetch(
      `data/equipment.json?v=${Date.now()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Equipment data is not an array.");
    }

    equipment = data;
    updateOverview();
    renderSubcategories();
    renderEquipment();
  } catch (error) {
    console.error(error);
    elements.list.innerHTML = `
      <div class="error-state">
        Equipment data is temporarily unavailable.<br>
        设备数据暂时无法加载，请稍后刷新。
      </div>
    `;
    elements.resultCount.textContent = "DATA UNAVAILABLE / 数据暂不可用";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  elements.list = document.getElementById("equipment-list");
  elements.subcategories = document.getElementById("subcategory-filters");
  elements.search = document.getElementById("equipment-search");
  elements.availableOnly = document.getElementById("available-only");
  elements.resultCount = document.getElementById("result-count");
  elements.totalModels = document.getElementById("total-models");
  elements.availableUnits = document.getElementById("available-units");

  bindEvents();
  loadEquipment();
});
