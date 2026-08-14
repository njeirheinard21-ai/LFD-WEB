const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// Configure Nodemailer with secure SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info.lfdservice@gmail.com',
    pass: process.env.EMAIL_PASSWORD || functions.config().email.password
  }
});

exports.sendActivationEmail = functions.firestore
  .document('activationKeys/{keyId}')
  .onCreate(async (snap, context) => {
    const keyData = snap.data();
    
    // Only send emails for unused keys
    if (keyData.status !== 'unused') return null;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-w-md; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #059669;">Optimal Healthcare</h2>
        <p>Hello,</p>
        <p>Your subscription activation key has been successfully generated.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <strong style="font-size: 24px; letter-spacing: 2px;">${keyData.key}</strong>
        </div>
        <p>This key is valid for the <strong>${keyData.plan}</strong> plan and will expire in 24 hours.</p>
        <p>Thank you for choosing Optimal Healthcare!</p>
      </div>
    `;

    const mailOptions = {
      from: 'Optimal Healthcare <info.lfdservice@gmail.com>',
      to: keyData.email,
      subject: 'Your Subscription Activation Key',
      html: emailHtml
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Activation email sent successfully to', keyData.email);
      // Log success
      await db.collection('emailLogs').add({
        to: keyData.email,
        keyId: context.params.keyId,
        status: 'delivered',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending email:', error);
      // Log failure for retry logic
      await db.collection('emailLogs').add({
        to: keyData.email,
        keyId: context.params.keyId,
        status: 'failed',
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

// Scheduled Function: Clean expired subscriptions and keys every 24 hours
exports.dailyMaintenance = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const nowStr = new Date().toISOString();
  let expiredCount = 0;

  // 1. Expire old subscriptions
  const subsRef = db.collection('subscriptions');
  const expiredSubs = await subsRef
    .where('status', '==', 'active')
    .where('expiryDate', '<', nowStr)
    .get();

  const batch = db.batch();
  expiredSubs.forEach(doc => {
    batch.update(doc.ref, { status: 'expired' });
    expiredCount++;
  });

  // 2. Expire old unused keys
  const keysRef = db.collection('activationKeys');
  const expiredKeys = await keysRef
    .where('status', '==', 'unused')
    .where('expiresAt', '<', nowStr)
    .get();

  expiredKeys.forEach(doc => {
    batch.update(doc.ref, { status: 'expired' });
  });

  await batch.commit();

  console.log(`Maintenance completed. Expired ${expiredCount} subscriptions and ${expiredKeys.size} keys.`);
});

// Scheduled Function: Every 30 days for data cleanup
exports.monthlyMaintenance = functions.pubsub.schedule('0 0 1 * *').onRun(async (context) => {
  console.log("Running monthly maintenance (Cleanup expired data, retry failed emails).");
  // Implement cleanup logic here
});
