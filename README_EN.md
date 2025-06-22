# MCSR Portal

English | [日本語](README.md)

A tool to easily set up MCSR (Minecraft Speedrun) environment for Minecraft 1.16 Speedrun (RSG, SSG, Ranked).

## Overview

MCSR Portal is an Electron application that automates the setup of Minecraft Speedrun environments. From downloading necessary files to creating optimized instances, everything can be done easily through a GUI interface.

## Supported Launchers

- **MultiMC**
- **Prism Launcher**

## System Requirements

- **OS**: Windows 10/11
- **Network**: Internet connection required

## Adding Languages

To add a new language, follow these steps:

1. Create a new language file in `src/renderer/data/locales/` folder (e.g., `fr.yml`)
2. Add language settings to `src/renderer/data/locales.json`
3. Add translation keys and text

### Language File Example (fr.yml)
```yaml
# French(fr)

# Global
next: "Suivant"
back: "Retour"
skip: "Passer"
cancel: "Annuler"
complete: "Terminé"
home: "Accueil"
# ... other translation keys
```

### Adding to locales.json
```json
{
  "languages": [
    { "code": "ja", "name": "日本語" },
    { "code": "en", "name": "English" },
    { "code": "fr", "name": "Français" }
  ]
}
```