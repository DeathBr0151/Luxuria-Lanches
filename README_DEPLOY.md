# Guia de Deploy - Luxuria Lanches

Este projeto está configurado para ser hospedado gratuitamente no **Vercel** ou **Netlify**.

## 1. Variáveis de Ambiente (Obrigatório)

Você deve cadastrar as seguintes variáveis no painel da Vercel ou Netlify. Copie os valores exatamente como aparecem abaixo:

| Nome da Variável | Valor para Copiar |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | `AIzaSyAu3x5_2QEY2o0I76TS_6H6koXE8yhZ5lA` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `gen-lang-client-0379863887.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `gen-lang-client-0379863887` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `gen-lang-client-0379863887.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `448789112744` |
| `VITE_FIREBASE_APP_ID` | `1:448789112744:web:e9b736c9fac82392dadf9d` |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | `ai-studio-c90c2a28-f7f3-4a51-ace5-e929592fbb8e` |

## 2. Configuração no Firebase Console

Para que o login funcione, você **PRECISA** autorizar o seu novo domínio:

1. Vá para o [Console do Firebase](https://console.firebase.google.com/).
2. Entre em **Authentication** > **Settings** > **Authorized domains**.
3. Adicione o domínio que a Vercel/Netlify te deu (ex: `luxuria-lanches.vercel.app`).

## 3. Arquivos de Configuração Incluídos

Já adicionei ao projeto:
- `vercel.json`: Para rotas na Vercel.
- `netlify.toml`: Para rotas e build no Netlify.
- `public/_redirects`: Backup para roteamento no Netlify.
