// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGVIfO1vN9khfd9fAzeR7fYzdqO6DLKt8",
  authDomain: "registro-infantil-9c615.firebaseapp.com",
  projectId: "registro-infantil-9c615",
  storageBucket: "registro-infantil-9c615.firebasestorage.app",
  messagingSenderId: "98455568557",
  appId: "1:98455568557:web:96958fef3e348d938c8624",
  measurementId: "G-6NH0H04XM4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
