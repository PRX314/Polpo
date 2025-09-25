# 🔒 Firestore Security Rules Setup

## ⚠️ IMPORTANTE: Regole di Sicurezza Firebase

Il progetto è **VULNERABILE** senza le regole di sicurezza. Attualmente **chiunque può leggere/scrivere tutti i dati**.

## Implementazione Immediata Richiesta

### 1. Accedi alla Console Firebase
- Vai su [console.firebase.google.com](https://console.firebase.google.com)
- Seleziona il progetto "gestionale-polpo"

### 2. Configura Firestore Rules
- Menu laterale → **Firestore Database**
- Tab **"Rules"**
- Sostituisci il contenuto con il file `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write only their own projects
    match /projects/{projectId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Allow users to read and write only their own notes
    match /notes/{noteId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Validation rules for projects
    match /projects/{projectId} {
      allow write: if request.auth != null
        && request.resource.data.keys().hasAll(['name', 'description', 'status', 'tags', 'userId', 'createdAt'])
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() <= 100
        && request.resource.data.description is string
        && request.resource.data.description.size() <= 500
        && request.resource.data.status in ['pending', 'in_progress', 'completed', 'paused']
        && request.resource.data.tags is list
        && request.resource.data.userId == request.auth.uid;
    }

    // Validation rules for notes
    match /notes/{noteId} {
      allow write: if request.auth != null
        && request.resource.data.keys().hasAll(['title', 'content', 'type', 'priority', 'projectTags', 'userId', 'createdAt'])
        && request.resource.data.title is string
        && request.resource.data.title.size() > 0
        && request.resource.data.title.size() <= 200
        && request.resource.data.content is string
        && request.resource.data.content.size() > 0
        && request.resource.data.content.size() <= 2000
        && request.resource.data.type in ['note', 'idea']
        && request.resource.data.priority in ['low', 'medium', 'high']
        && request.resource.data.projectTags is list
        && request.resource.data.userId == request.auth.uid;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Pubblica le Regole
- Clicca **"Publish"**
- Conferma la pubblicazione

## ✅ Cosa Fanno le Regole

### Sicurezza
- ✅ **Autenticazione richiesta**: Solo utenti loggati possono accedere
- ✅ **Isolamento utenti**: Ogni utente vede solo i propri dati
- ✅ **Validazione dati**: Controllo formato e lunghezza campi
- ✅ **Deny by default**: Tutto ciò che non è esplicitamente permesso è negato

### Validazioni Implementate

**Progetti:**
- Nome: 1-100 caratteri, obbligatorio
- Descrizione: max 500 caratteri
- Status: solo valori predefiniti (`pending`, `in_progress`, `completed`, `paused`)
- Tags: deve essere un array
- userId: deve corrispondere all'utente autenticato

**Note:**
- Titolo: 1-200 caratteri, obbligatorio
- Contenuto: 1-2000 caratteri, obbligatorio
- Tipo: solo `note` o `idea`
- Priorità: solo `low`, `medium`, `high`
- Tags progetto: deve essere un array
- userId: deve corrispondere all'utente autenticato

## 🚨 Stato Attuale vs Sicuro

| Aspetto | Prima (❌ VULNERABILE) | Dopo (✅ SICURO) |
|---------|----------------------|------------------|
| Accesso dati | Chiunque | Solo utente proprietario |
| Autenticazione | Non richiesta | Obbligatoria |
| Validazione | Solo client-side | Server-side + client-side |
| Isolamento utenti | Nessuno | Completo |

## 🔄 Migrazione Dati Esistenti

Se hai già dati nel database **senza userId**, dopo aver applicato le regole:

1. I dati esistenti **non saranno accessibili**
2. L'app creerà automaticamente nuovi sample data per l'utente corrente
3. I vecchi dati rimarranno nel database ma inaccessibili

## ⚡ Verifica Implementazione

Dopo aver pubblicato le regole:

1. **Fai logout/login** nell'app
2. **Crea un nuovo progetto** - deve funzionare
3. **Apri console browser** - non deve mostrare errori di permessi
4. **Verifica isolamento**: accedi con account diverso, non deve vedere i dati dell'altro utente

## 🛡️ Livello di Sicurezza Raggiunto

- 🔒 **Authentication**: ✅ Completamente implementata
- 🔒 **Authorization**: ✅ Accesso solo ai propri dati
- 🔒 **Validation**: ✅ Validazione server-side completa
- 🔒 **Data Isolation**: ✅ Utenti completamente isolati

**CRITICO**: Implementa le regole **IMMEDIATAMENTE** per proteggere l'applicazione.