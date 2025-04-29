// Hook principal
Hooks.on("renderItemSheetV2", (sheet, html, data) => {
  const item = sheet.item;
  if (!["weapon", "equipment"].includes(item.type)) return;
  const root = html instanceof HTMLElement ? html : html[0];

  if (root.querySelector(".essence-module-fieldset")) return;

  const fieldset = document.createElement("fieldset");
  fieldset.classList.add("essence-module-fieldset");

  const legend = document.createElement("legend");
  const localizedTitle = game.i18n.localize("ESSENCE.SectionTitle");

  const tidyFieldset = [...root.querySelectorAll("fieldset")].find(fs =>
    fs.querySelector("legend")?.textContent?.includes("Tidy 5e Sheets Settings")
  );

  legend.innerHTML = tidyFieldset
    ? `${localizedTitle}<tidy-gold-header-underline><div role="presentation" class="gold-header-underline"></div></tidy-gold-header-underline>`
    : localizedTitle;

  fieldset.appendChild(legend);

  const currentSlots = item.getFlag("essence-system", "slots") ?? 0;
  const wrapper = document.createElement("div");
  wrapper.classList.add("form-group", "essence-slots-wrapper");
  wrapper.innerHTML = `
    <label for="essence-slots">${game.i18n.localize("ESSENCE.EssenceSlots")}</label>
    <div class="form-fields">
      <input type="number" name="flags.essence-system.slots" id="essence-slots"
        value="${currentSlots}" data-dtype="Number" />
    </div>
  `;
  fieldset.appendChild(wrapper);

  if (tidyFieldset) {
    tidyFieldset.parentElement.insertBefore(fieldset, tidyFieldset);
  } else {
    const detailsTab = root.querySelector('.tab.details');
    if (detailsTab) detailsTab.appendChild(fieldset);
  }

  const filled = item.getFlag("essence-system", "filledSlots") ?? 0;
  updateEssenceSlotDisplay(sheet, html, { slots: currentSlots, filled });

  const slotsInput = root.querySelector('input[name="flags.essence-system.slots"]');
  if (slotsInput) {
    slotsInput.addEventListener("input", () => {
      const newSlots = parseInt(slotsInput?.value) || 0;
      const filled = item.getFlag("essence-system", "filledSlots") ?? 0;
      updateEssenceSlotDisplay(sheet, html, { slots: newSlots, filled });
    });
  }
});

// Injection visuelle
function updateEssenceSlotDisplay(sheet, html, { slots, filled }) {
  const root = html instanceof HTMLElement ? html : html[0];

  root.querySelector(".essence-slots-group, .essence-slots-pill")?.remove();

  const tidyPills = root.querySelector("aside.sidebar ul.pills.stacked");
  if (tidyPills) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("form-group", "essence-slots-group");
    
    wrapper.innerHTML = `
      <h4>${game.i18n.localize("ESSENCE.EssenceSlots")}</h4>
      <div class="form-fields essence-slot-field-container">
      </div>
    `;
    
    const slotContainer = renderEssenceSlots(slots, filled, sheet.item);
    const containerTarget = wrapper.querySelector(".essence-slot-field-container");
    if (containerTarget) {
      containerTarget.appendChild(slotContainer);
    } else {
      console.warn("EssenceSystem | Slot container introuvable pour injection");
    }
    // wrapper.appendChild(renderEssenceSlots(slots, filled, sheet.item));
    tidyPills.parentElement.insertBefore(wrapper, tidyPills.nextSibling);
  } else {
    const pillsContainer = root.querySelector('.tab[data-tab="description"] ul.pills');
    if (pillsContainer) {
      const li = document.createElement("li");
      li.classList.add("transparent", "essence-slots-pill");
      li.appendChild(renderEssenceSlots(slots, filled, sheet.item));
      pillsContainer.appendChild(li);
    }
  }
}

// Active Effects : on force le rerendu avec le bon HTML
for (const hook of ["createActiveEffect", "deleteActiveEffect"]) {
  Hooks.on(hook, (effect) => {
    const item = effect.parent;
    if (item?.documentName !== "Item") return;
    if (!["weapon", "equipment"].includes(item.type)) return;

    Hooks.once("renderItemSheetV2", (sheet, html) => {
      const slots = item.getFlag("essence-system", "slots") ?? 0;
      const filled = item.getFlag("essence-system", "filledSlots") ?? 0;
      updateEssenceSlotDisplay(sheet, html, { slots, filled });
    });

    // on redessine la fiche pour déclencher renderItemSheetV2
    item.sheet?.render(true);
  });
}


function getFilledSlots(item) {
    return item.getFlag("essence-system", "filledSlots") ?? 0;
}
  
function renderEssenceSlots(total, filled, item = null) {
  const container = document.createElement("div");
  container.classList.add("essence-slots");

  for (let i = 0; i < total; i++) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("essence-slot");
    wrapper.style.position = "relative";
    wrapper.style.width = "16px";
    wrapper.style.height = "16px";

    const empty = document.createElement("img");
    empty.classList.add("slot-empty");
    empty.src = game.settings.get("essence-system", "empty-slot-image");
    empty.width = 16;
    empty.height = 16;
    wrapper.appendChild(empty);

    if (i < filled) {
      const glowEnabled = game.settings.get("essence-system", "enableGlowEffect");
    
      if (glowEnabled) {
        wrapper.classList.add("filled-glow"); // ::after aura
      }
      const full = document.createElement("img");
      full.classList.add("slot-filled");
      full.src = game.settings.get("essence-system", "filled-slot-image");
      full.width = 16;
      full.height = 16;
      wrapper.appendChild(full);
    }

    const isFilled = i < filled;
    const tooltip = getEssenceTooltip(i, total, filled);
    wrapper.setAttribute("data-tooltip", tooltip);
    game.tooltip.activate(wrapper);
    

    container.appendChild(wrapper);
  }

  return container;
}

  Hooks.on("renderActorSheet5eCharacter2", (app, html, data) => {
    const actor = app.actor;
  
    html.find(".items-list .item").each((i, row) => {
      const $row = $(row);
      const itemId = $row.data("itemId");
      const item = actor.items.get(itemId);
      if (!item || !["weapon", "equipment"].includes(item.type)) return;
  
      const totalSlots = item.getFlag("essence-system", "slots") ?? 0;
      const filledSlots = item.getFlag("essence-system", "filledSlots") ?? 0;
      if (totalSlots === 0) return;
  
      const summary = $row.find(".wrapper")[0];
      if (!summary) return;
  
      // 💡 Injection initiale si déjà ouverte
      injectEssenceSlots($row, item);
  
      // 🎯 Observer les changements sur le bloc déroulant
      const observer = new MutationObserver(() => {
        injectEssenceSlots($row, item);
      });
  
      observer.observe(summary, { childList: true, subtree: true });
    });
  });
  
  Hooks.on("dnd5e.displayCard", async (item, chatMessage) => {

    const totalSlots = item.getFlag("essence-system", "slots") ?? 0;
    const filledSlots = item.getFlag("essence-system", "filledSlots") ?? 0;
    if (totalSlots === 0) return;
  
    const html = $($.parseHTML(chatMessage.content));
  
    const header = html.find(".card-header.description.collapsible");
    if (!header.length || html.find(".essence-slots-chatcard").length) return;
  
    const container = $(`<div class="essence-slots-chatcard" style="display: flex; gap: 2px; margin: 0em 0 0.25em 0;"></div>`);
  
    for (let i = 0; i < totalSlots; i++) {
      const slot = $(`<span class="essence-slot" style="position: relative; width: 12px; height: 12px;"></span>`);
  
      game.tooltip.activate(slot[0]);
  
      const emptyImg = $('<img class="slot-empty">').attr("src", game.settings.get("essence-system", "empty-slot-image"));
      emptyImg.css({ position: "absolute", top: 0, left: 0, width: "12px", height: "12px" });
      slot.append(emptyImg);
  
      if (i < filledSlots) {
        const fullImg = $('<img class="slot-filled">').attr("src", game.settings.get("essence-system", "filled-slot-image"));
        fullImg.css({ position: "absolute", top: 0, left: 0, width: "12px", height: "12px" });
        const glowEnabled = game.settings.get("essence-system", "enableGlowEffect");
        if (glowEnabled) {
          slot.addClass("filled-glow");
        }
        slot.append(fullImg);
      }
  
      container.append(slot);
    }
  
    // 💡 Injection entre header et footer
    header.after(container);
  
    // Met à jour le message
    const wrapper = $("<div>").append(html);
    await chatMessage.update({ content: wrapper.html() });
  });
   
  
  function injectEssenceSlots($row, item) {
    const totalSlots = item.getFlag("essence-system", "slots") ?? 0;
    const filledSlots = item.getFlag("essence-system", "filledSlots") ?? 0;
    if (totalSlots === 0) return;
  
    const props = $row.find(".item-properties.pills");
    if (!props.length || props.find(".essence-slots-inline").length) return;
  
    const container = $(`<span class="tag pill transparent pill-xs essence-slots-inline" style="display: inline-flex; gap: 2px; border: none;"></span>`);
  
    for (let i = 0; i < totalSlots; i++) {
      const tooltip = getEssenceTooltip(i, totalSlots, filledSlots);
      const slot = $(`<span class="essence-slot" data-tooltip="${tooltip}" style="position: relative; width: 12px; height: 12px;"></span>`);
      
      game.tooltip.activate(slot[0]);
            
      const emptyImg = $('<img class="slot-empty">').attr("src", game.settings.get("essence-system", "empty-slot-image"));
      emptyImg.css({ position: "absolute", top: 0, left: 0, width: "12px", height: "12px" });
      slot.append(emptyImg);
  
      if (i < filledSlots) {
        const fullImg = $('<img class="slot-filled">').attr("src", game.settings.get("essence-system", "filled-slot-image"));
        fullImg.css({ position: "absolute", top: 0, left: 0, width: "12px", height: "12px" });
        const glowEnabled = game.settings.get("essence-system", "enableGlowEffect");
        if (glowEnabled) {
          slot.addClass("filled-glow");
        }
        slot.append(fullImg);
      }
  
      container.append(slot);
    }
  
    props.append(container);
  }
  
  function getEssenceTooltip(index, total, filled) {
    return index < filled
      ? game.i18n.localize("ESSENCE.FilledSlot")
      : game.i18n.localize("ESSENCE.EmptySlot");
  }
  
  
  