# 📍 Austin Crime Heatmap & Analysis
<p align="center">
  <img src="images/logo.png" width="150" alt="App Logo" />
</p>

An interactive mobile application built with **React Native** and **Expo** that visualizes and analyzes crime data across Austin, Texas City Council Districts.

---

## 📱 Project Preview
<p align="center">
  <img src="images/preview.png" width="400" alt="App Screenshot" />
</p>

## 🚀 Features
* **Interactive Council Districts:** Every Austin district is mapped using precise geographic coordinates. 
* **Dynamic Heatmap:** Districts change color based on the volume of incidents (High = Red, Med = Orange, Low = Green).
* **Yearly Filtering:** Quickly switch between "All Time" and specific years (2024, 2025, 2026) to see trends.
* **In-Depth Statistics:** A custom modal provides a breakdown of the top 3 crime types and a full historical log.
* **Live Data Integration:** Uses `PapaParse` to stream data directly from a Google Sheets CSV export.

## 🛠️ Tech Stack
* **Framework:** React Native (Expo SDK)
* **Maps:** react-native-maps (Google Maps Provider)
* **Data:** PapaParse & Austin Open Data Portal
* **Icons:** Ionicons

## 📦 Installation
1. `git clone https://github.com/Jspaun-00/AustinHeatMap.git`
2. `npm install`
3. `npx expo start`