# Health Check (Expo + Gemini + Pollen)

An Expo Go app that uses a **picture of your eyes**, **voice recording**, and **Google Pollen API** data, analyzed by **Gemini** on a small backend, to give a simple “are you sick?” assessment.

## Get started

### 1. Install dependencies

```bash
npm install
```

### 2. Backend (API keys stay here, not in the app)

```bash
cd backend
cp .env.example .env
# Edit .env: set GEMINI_API_KEY (and optionally GOOGLE_POLLEN_API_KEY)
npm install
npm run dev
```

Backend runs at `http://localhost:3001`. For a physical device, use your machine’s IP and set `EXPO_PUBLIC_API_URL` in the app’s `.env` **NetworkError?** On a real device, set `EXPO_PUBLIC_API_URL` in the project root `.env` to your computer IP (e.g. `http://192.168.1.5:3001`). Find IP: `ip addr` or `ipconfig`. Restart Expo after changing `.env`.

### 3. App config

In the project root, copy env and set the backend URL if needed:

```bash
cp .env.example .env
# Optional: set EXPO_PUBLIC_API_URL to http://YOUR_IP:3001 for Expo Go on device
```

### 4. Start the app

```bash
npx expo start
```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
