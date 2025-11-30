# Emotion Detector Extension

A privacy-focused browser extension that analyzes text content on web pages to detect emotional states and potential mental health indicators. Powered by a custom fine-tuned RoBERTa model.

## 🚀 Features

-   **Platform Support**: Specifically optimized for analyzing comments on **YouTube**,-   **Platform Support**: Specifically optimized for analyzing comments on **YouTube**, **Reddit**, and **X (Twitter)**.
-   **Privacy First**: All analysis is done via a secure backend API; no data is stored permanently.
-   **7 Emotion Categories**: Detects ADHD, Anxiety, Autism, BPD, Depression, PTSD, and Normal/Neutral states.
-   **Visual Insights**: Displays a breakdown of detected emotions in a clean, easy-to-read chart.

## 🛠️ Tech Stack

-   **Frontend (Extension)**: HTML, CSS, JavaScript (Manifest V3)
-   **Backend (API)**: Python, Flask, Gunicorn
-   **ML Model**: RoBERTa (Fine-tuned), hosted on [Hugging Face](https://huggingface.co/ekam28/emotion-detector)
-   **Infrastructure**: Docker, Docker Compose

## 📦 Installation

### Prerequisites

-   Docker & Docker Compose
-   Google Chrome (or Chromium-based browser)

### 1. Start the Backend

The backend handles the heavy lifting of running the ML model.

```bash
# Clone the repository
git clone https://github.com/Ekam-Bitt/emotion-detector-extension.git
cd emotion-detector-extension

# Start the services
docker compose up --build
```

*Note: On the first run, the system will automatically download the model (~500MB) from Hugging Face. This may take a few minutes.*

### 2. Load the Extension

1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** (top right toggle).
3.  Click **Load unpacked**.
4.  Select the `extension` folder from this repository.

## 🖥️ Usage

1.  Navigate to a **YouTube** video, **Reddit** thread, or **X (Twitter)** post with comments.
2.  Click the **Emotion Detector** icon in your browser toolbar.
3.  The extension will analyze the visible text and display a pie chart of the detected emotions.

## 🧠 Model Details

The core of this project is a custom fine-tuned RoBERTa model trained to classify text into the following categories:

| Label | Condition |
| :--- | :--- |
| `LABEL_0` | ADHD |
| `LABEL_1` | Anxiety |
| `LABEL_2` | Autism |
| `LABEL_3` | BPD (Borderline Personality Disorder) |
| `LABEL_4` | Depression |
| `LABEL_5` | PTSD |
| `LABEL_6` | Normal |

You can view the model directly on Hugging Face: [ekam28/emotion-detector](https://huggingface.co/ekam28/emotion-detector)

## ⚠️ Disclaimer

This tool is for **educational and informational purposes only**. It is **NOT** a diagnostic tool and should not be used to diagnose mental health conditions. The results are based on statistical patterns in text and may not reflect the actual mental state of an individual.

## 📄 License

MIT License
