Hooks.once("init", () => {
    game.settings.register("essence-system", "empty-slot-image", {
        name: "ESSENCE.Settings.EmptySlotImage.Name",
        hint: "ESSENCE.Settings.EmptySlotImage.Hint",
        scope: "world",
        config: true,
        type: String,
        filePicker: 'image',
        default: "./modules/essence-system/assets/images/empty-slot.png"
    });
    game.settings.register("essence-system", "filled-slot-image", {
        name: "ESSENCE.Settings.FilledSlotImage.Name",
        hint: "ESSENCE.Settings.FilledSlotImage.Hint",
        scope: "world",
        config: true,
        type: String,
        filePicker: 'image',
        default: "./modules/essence-system/assets/images/filled-slot.png"
    });
    game.settings.register("essence-system", "enableGlowEffect", {
        name: "ESSENCE.Settings.Glow.Name",
        hint: "ESSENCE.Settings.Glow.Hint",
        scope: "client",
        config: true,
        default: true,
        type: Boolean
      });
  });
  