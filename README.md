# RK Developers — Labour Payment Manager (Stage 1)

React Native / Expo Android starter. Includes branded dashboard, camera photo capture, manual labour payment entry, automatic line totals, advance deduction, and on-device payment history.

## Run
1. Install Node.js LTS and Expo Go on Android.
2. Open this folder in VS Code terminal.
3. `npm install`
4. `npx expo start`
5. Scan the QR code in Expo Go (same Wi-Fi), or use `npx expo start --tunnel` if necessary.
6. Run `npm run typecheck` to check TypeScript.

## Not implemented yet
Handwriting OCR, auto name/phone/date extraction, cloud sync, PDF generation, reports, and production APK build. The camera currently attaches a photo only. Confirm handwritten data before saving.

## Notes
Sample form has a printed phone number which may belong to the form issuer, not the labour receiver. The future scanner must not assume the printed phone is the receiver's number.
