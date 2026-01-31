# SmartEdit: An Intelligent Editing Assistant Tool

[简体中文](README.md) | English

<p align="center">
  <img src="assets/icons/icon128.png" alt="Intelligent Editing Assistant Tool" width="128" height="128">
</p>

<p align="center">
  <strong>AI-Powered Editor Enhancement Tool</strong><br>
  AI Writing · AI Summary · RSS · Obsidian Integration
</p>

---

## 💡 About This Project

SmartEdit is a **locally-running** intelligent editing assistant tool that requires **no cloud synchronization**.

Users only need to configure their own API Keys for various services as needed, and use them without paying any additional fees. All data is processed locally to protect your privacy.

For detailed configuration instructions, please refer to: [Documentation](https://docs.smartedit.app/)

---

## 📸 Feature Preview

<p align="center">
  <img src="image/1.png" alt="Sidebar Style Library" width="800"><br>
  <em>Sidebar Style Library - Rich style templates, click to use</em>
</p>

<p align="center">
  <img src="image/7.png" alt="Custom Modular Configuration" width="800"><br>
  <em>Custom Modular Configuration</em>
</p>

<p align="center">
  <img src="image/9.png" alt="Settings Page" width="800"><br>
  <em>Settings Page - Flexible AI service and theme configuration</em>
</p>

---

## ✨ Features

### 🎨 Super Editor
- **Sidebar Style Library** - Rich title, body, divider, card, and list styles, click to use
- **One-Click Color System** - 10+ preset theme colors, support custom colors, one-click replacement of full-text color scheme
- **Full-Text One-Click Formatting** - 4 curated templates (Simple & Fresh / Business Professional / Literary Elegant / Tech Modern)
- **Quick Format Tools** - Clear format, first-line indent, adjust line height

### 🤖 AI Creation Engine
- **AI Title Generation** - Generate 10 high-click-rate titles based on article content with one click
- **AI Title Scoring** - Score titles from 0-100 and provide optimization suggestions
- **AI Word Selection Rewriting** - Select text to polish, expand, condense, or change tone
- **AI Writing Assistant** - Enter a topic to generate article outlines or complete articles

### 🖼️ Image Center
- **Unsplash Integration** - Massive high-quality free images
- **Pixabay Integration** - Rich royalty-free image materials
- **One-Click Insert** - Search and insert images directly into the editor

### 🛠️ Convenient Tools
- **Left Sidebar** - Core functions including style library, AI writing, and image center
- **Right Smart Assistant** - Quick tools, notes, AI assistant, page info (push layout, no content blocking)
- **Floating Toolbar** - Quick page access
- **Word Selection Toolbar** - Automatically pop up AI tools when selecting text
- **Context Menu** - Quick access to various functions

---

## 📦 Installation

### Requirements

- **Node.js**: v20.19.4+
- **npm**: v10.8.2+

### Developer Mode Installation

1. Download or clone this project locally
2. Open Chrome browser and visit `chrome://extensions/`
3. Enable "Developer mode" in the upper right corner
4. Click "Load unpacked"
5. Select the project folder

### Icon Generation (Optional)

If icons display abnormally, run:

```bash
npm install sharp
node scripts/generate-icons.js
```

---

## 🔧 Development Guide

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
# Start watch mode, automatically monitor file changes and rebuild
npm run dev
```

### Build Project

```bash
# Full build
npm run build

# Build main program only (popup/options/background)
npm run build:main

# Build content script only
npm run build:content
```

### Debugging Methods

1. **Load Extension**
   - Visit `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project's `dist` folder

2. **Hot Reload Debugging**
   - Run `npm run dev` to start watch mode
   - After modifying code, wait for the terminal to show build completion
   - Click the 🔄 refresh button of the extension in `chrome://extensions/`
   - Refresh the target webpage

3. **Debug Content Script**
   - Press F12 on the target page to open DevTools
   - Find `content.js` in the Sources panel
   - Set breakpoints for debugging

4. **Debug Background Script**
   - Find the extension in `chrome://extensions/`
   - Click the "Service Worker" link to open DevTools

5. **Debug Popup/Options Page**
   - Right-click the extension icon popup or settings page
   - Select "Inspect" to open DevTools

### Project Structure

```
src/
├── background/     # Service Worker background script
├── content/        # Content Script (injected into page)
│   ├── components/ # React components
│   ├── styles/     # Style template data
│   └── utils.ts    # Utility functions
├── options/        # Settings page
└── popup/          # Popup window
```

### Package and Release

```bash
# Generate zip package
npm run zip
```

---

## ⚙️ Configuration

### AI Service Configuration

1. Click the extension icon and select "Settings"
2. Select a service provider in "AI Configuration":
   - **OpenAI** - Requires OpenAI API Key
   - **Zhipu AI** - Requires Zhipu API Key
3. Enter the corresponding API Key
4. Click "Test Connection" to verify configuration

### Image Service Configuration

1. **Unsplash**
   - Visit [Unsplash Developers](https://unsplash.com/developers)
   - Create an app to get Access Key

2. **Pixabay**
   - Visit [Pixabay API](https://pixabay.com/api/docs/)
   - Register to get API Key

---

## 🚀 User Guide

### Basic Usage

1. Open any webpage
2. Click the extension icon or use the context menu
3. Choose to open the left sidebar or right smart assistant
4. Left sidebar: Style library, AI writing, image center, etc.
5. Right smart assistant: Quick tools, notes, AI assistant, page info

### Insert Styles

1. Browse styles in the sidebar "Style Library"
2. Click a style to insert it at the editor cursor position
3. Use "One-Click Color Change" to modify theme colors

### AI Writing

1. Switch to the "AI Writing" tab
2. Paste article content and click "Generate Title"
3. Select the generated title to copy and use

### Word Selection Rewriting

1. Select a piece of text in the editor
2. Select an operation from the popup toolbar:
   - Polish - Optimize text expression
   - Expand - Add content details
   - Condense - Simplify content
   - Change Tone - Alter expression style

### Right Smart Assistant

1. Open the right assistant through the extension icon or context menu
2. **Quick Tools**: Word count, copy link, generate QR code, etc.
3. **Quick Notes**: Record ideas anytime, auto-save
4. **AI Assistant**: Quick text processing (summarize, translate, polish, expand)
5. **Page Info**: View detailed information and statistics of the current page
6. Press ESC to quickly close the sidebar

---

## 📁 Project Structure

```
EditorHelper/
├── manifest.json          # Extension configuration file
├── background/
│   └── background.js      # Background service script
├── content/
│   ├── content.js         # Content script
│   └── content.css        # Content styles
├── popup/
│   ├── popup.html         # Popup page
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup script
├── options/
│   ├── options.html       # Settings page
│   ├── options.css        # Settings styles
│   └── options.js         # Settings script
├── assets/
│   └── icons/             # Extension icons
└── scripts/
    └── generate-icons.js  # Icon generation script
```

---

## 🔧 Tech Stack

- **Extension Standard**: Chrome Manifest V3
- **Frontend**: Native JavaScript + CSS
- **AI Interface**: OpenAI API / Zhipu AI API
- **Image Service**: Unsplash API / Pixabay API

---

## 📝 Changelog

### v0.0.1 (2025-12)
- 🎉 First release
- ✨ Style library feature
- ✨ AI title generation
- ✨ AI word selection rewriting
- ✨ Image center
- ✨ One-click formatting


## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 💬 Contact Us

- Issue Feedback: [GitHub Issues](https://github.com/smartedit-ai/smartedit-ai/issues)
- Email: support@smartedit.app


---

<p align="center">
  Made with ❤️ for Content Creators
</p>
