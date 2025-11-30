# Emotion Detector Extension

A Chrome extension that helps **content creators** quickly understand audience feedback on their posts and videos.

It analyzes comments from **YouTube, X (Twitter), and Reddit**, using the [Cardiff NLP `twitter-xlm-roberta-base-sentiment`](https://huggingface.co/cardiffnlp/twitter-xlm-roberta-base-sentiment) model from Hugging Face to classify text into **positive, negative, or neutral** sentiment.

# Images

| Main Popup | Sentiment Chart | Filtered Comments |
| :---: | :---: | :---: |
| <img width="498" height="508" alt="Popup" src="https://github.com/user-attachments/assets/70861fbc-6461-4749-ba3e-d70c6f7a0e91" /> | <img width="498" height="508" alt="Chart" src="https://github.com/user-attachments/assets/2ad96ef9-ce0e-4824-8956-11af4013062d" /> | <img width="498" height="508" alt="Filtered" src="https://github.com/user-attachments/assets/cbdef5cd-a3d1-4bbd-aad6-d86eeaad9a23" /> |

## ✨ Why Content Creators Will Love It

* **Instant Feedback Analysis**
  No need to manually scroll through hundreds of comments—get a quick breakdown of how your audience is reacting.

* **Visual Sentiment Insights**
  A chart shows you the balance of positive, neutral, and negative responses at a glance.

* **Comment Filtering**
  Want to see only critical feedback or only supportive comments? Filter instantly.

* **Supported Platforms**
  Works today on **YouTube, X (Twitter), and Reddit**, the platforms where audience feedback matters most.

## 🚀 Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/emotion-detector-extension.git
   ```
2. Open Chrome (or Brave) and go to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the cloned repository folder.

## 🖱 Usage

1. Open a YouTube video, X post, or Reddit thread with comments.
2. Click the **Emotion Detector** icon in your browser’s toolbar.
3. On first use, enter your **Hugging Face API key**.

   * You can generate one at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
4. Press **Analyze Comments**.
5. View:

   * **Sentiment chart** → see overall audience mood.
   * **Filtered comment list** → dive into supportive or critical feedback.

## 🤝 Contributing

Contributions are always welcome! 🎉

* Open an [issue](../../issues) for feature requests or bug reports.
* Submit a pull request with improvements or fixes.
## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
