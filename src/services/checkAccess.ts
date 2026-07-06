import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export const checkUserAccess = async (deviceId: string) => {
  console.log(deviceId, "id");

  const ref = doc(db, "div", deviceId);
  const snap = await getDoc(ref);

  let data: any;

  // =========================
  // 🟢 CREATE USER IF NOT EXISTS
  // =========================
  if (!snap.exists()) {
    console.log("Creating user...");

    data = {
      deviceId: deviceId, // ✅ FIXED
      isActive: true,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };

    await setDoc(ref, data);

    console.log("User CREATED SUCCESSFULLY");
  } else {
    data = snap.data();
  }

  // =========================
  // 🔄 UPDATE LAST SEEN (SAFE)
  // =========================
  try {
    await updateDoc(ref, {
      lastSeen: serverTimestamp(),
    });
  } catch (err) {
    console.log("updateDoc error (ignore if new doc):", err);
  }

  // =========================
  // 🚫 BLOCK CHECK
  // =========================
  if (data?.isBlocked === true || data?.isActive === false) {
    return {
      isActive: false,
      isBlocked: true,
      ...data,
    };
  }

  return {
    isActive: true,
    isBlocked: false,
    ...data,
  };
};