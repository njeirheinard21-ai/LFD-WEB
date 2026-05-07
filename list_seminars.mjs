import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function listPastSeminars() {
  try {
    const snapshot = await getDocs(collection(db, 'pastSeminars'));
    console.log(`Found ${snapshot.size} past seminars!`);
    for (const d of snapshot.docs) {
      console.log(`ID: ${d.id}, Title: ${d.data().title}`);
      await deleteDoc(doc(db, 'pastSeminars', d.id));
      console.log(`Deleted ${d.id}`);
    }
  } catch (err) {
    console.error("Failed to list past seminars:", err);
  }
  process.exit(0);
}

listPastSeminars();
