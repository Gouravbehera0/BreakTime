# BreakTime Android Application 🌙

> **"Pause the World. Live the Moment."**

BreakTime is a native Android application designed to help people invite friends, partners, and groups to spend quality time together through one-tap invitations.

This repository implements the **Login, Registration, and Password Reset screens** following the **Midnight Neomorphism** design language.

---

## 🎨 Visual Identity: Midnight Neomorphism

The interface is custom-built to feel intimate, calm, and expressive — avoiding standard corporate, banking, or Material 3 light themes.

### Strict Color Palette

| Token | Hex Value | Usage |
|---|---|---|
| **Main Background** | `#17171C` | Screen base background |
| **Secondary Background** | `#1C1C23` | Social pill, elevated containers |
| **Raised Card Surface** | `#202027` | Beveled neomorphic cards & logo base |
| **Dark Shadow** | `#101014` | Bottom-right elevation drop shadows |
| **Light Shadow / Highlight** | `#30303A` | Top-left specular highlights and rim bevels |
| **Primary Accent** | `#B45CFF` | Vibrant neon purple glow, active focus, links |
| **Secondary Accent** | `#8B5CF6` | Primary button gradient start & deep purple tone |
| **Primary Text** | `#F5F3FA` | High-contrast headers, input values, button text |
| **Secondary Text** | `#A5A0B5` | Muted labels, placeholders, supporting text |
| **Input Background** | `#1B1B22` | Recessed form input surface |
| **Input Border** | `#34313D` | Default recessed field outline |
| **Input Focused Border**| `#9E65FF` | Animated glow outline on focus |
| **Error** | `#FF6B81` | Validation errors and failure feedback |
| **Success** | `#86EFAC` | Reset link dispatched confirmation |

---

## 🧱 Architecture & Project Structure

The project adheres to Clean Architecture with MVVM and unidirectional data flow using Kotlin Coroutines and `StateFlow`:

```
com.breaktime.app
├── MainActivity.kt                      # Edge-to-edge Activity host
│
├── navigation/
│   ├── Routes.kt                        # Screen route identifiers
│   └── AppNavGraph.kt                   # NavHost with smooth transitions
│
├── ui/
│   ├── theme/
│   │   ├── Color.kt                     # Midnight Neomorphism palette & gradients
│   │   ├── Type.kt                      # Clean typography
│   │   ├── Shapes.kt                    # Neomorphic corner radii
│   │   └── Theme.kt                     # Dark theme enforcer & system bar colors
│   │
│   ├── components/
│   │   ├── AmbientBackground.kt         # Canvas-drawn celestial orbs & purple horizon
│   │   ├── BreakTimeLogo.kt             # Brand squircle, neon ring, pause bars & orbit orb
│   │   ├── NeomorphicCard.kt            # Raised surface with dual highlight/shadow
│   │   ├── NeomorphicTextField.kt       # Recessed two-line input with animated focus glow
│   │   ├── PrimaryGradientButton.kt     # #8B5CF6 -> #B45CFF gradient with arrow & loading
│   │   ├── SocialLoginButton.kt         # Neomorphic Google Sign-in button with vector logo
│   │   ├── NeomorphicCheckbox.kt        # Animated checkbox with purple checked state
│   │   └── PasswordVisibilityToggle.kt  # Accessible show/hide password toggle
│   │
│   ├── auth/
│   │   ├── LoginScreen.kt               # Midnight Neomorphism Login UI
│   │   ├── LoginViewModel.kt            # Login form state, validation, auth triggers
│   │   ├── RegisterScreen.kt            # Create Account UI with terms checkbox
│   │   ├── RegisterViewModel.kt         # Registration state & password confirmation
│   │   ├── ForgotPasswordScreen.kt      # Password recovery screen & confirmation card
│   │   └── ForgotPasswordViewModel.kt   # Password reset state handler
│   │
│   └── home/
│       └── HomeScreen.kt                # Landing destination after successful login
│
├── data/
│   └── auth/
│       ├── AuthRepository.kt            # Repository contract
│       ├── SupabaseConfig.kt            # Supabase credentials loader & validator
│       └── SupabaseAuthRepository.kt    # Supabase Kotlin SDK implementation
│
└── domain/
    └── auth/
        ├── AuthState.kt                 # Auth state & user models
        └── ValidationUtils.kt           # Pure Kotlin validation functions
```

---

## 🔐 Supabase Authentication Integration

BreakTime is built to connect directly to [Supabase Auth](https://supabase.com/docs/guides/auth).

### How to Configure Supabase

1. Create a project at [Supabase](https://database.new) or open your existing project.
2. In the project root of `BreakTime`, open or create `local.properties`:
   ```properties
   # Supabase Credentials (automatically injected into BuildConfig)
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   *(Note: `local.properties` is in `.gitignore` and is never committed to source control).*
3. Alternatively, supply them as environment variables:
   ```bash
   export SUPABASE_URL="https://your-project-id.supabase.co"
   export SUPABASE_ANON_KEY="your-anon-key"
   ```
4. **Compile and Run**: If credentials are not yet configured, the app compiles smoothly and shows a clean, helpful configuration dialog if a login or register attempt is triggered, preventing accidental silent failures or fake mock authentications.

---

## 🚀 Running the Application in Android Studio

1. Open **Android Studio** (Koala / Ladybug / 2024.1+).
2. Select **File -> Open...** and navigate to `c:\Users\GOURAV KUMAR BEHERA\Downloads\BreakTime`.
3. Wait for Gradle sync to complete. Android Studio will automatically resolve dependencies via the included `gradlew` wrapper (Gradle 8.14.3).
4. Connect an Android device or start an Android Virtual Device (AVD) running Android 8.0 (API 26) or higher.
5. Click the green **Run 'app'** button (or press `Shift + F10`).

---

## 🧪 Running Unit Tests

Unit tests cover input validation, password matching, email regex, error states, and ViewModel reactive state flows.

To run the unit tests from the command line:

```powershell
.\gradlew.bat test
```

Or right-click the `app/src/test` folder in Android Studio and select **Run 'Tests in 'app.test''**.
