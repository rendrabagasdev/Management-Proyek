# 🚀 Production Deployment Checklist

## ✅ Pre-Deployment

### 1. Environment Variables

- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Update all production values (DATABASE_URL, NEXTAUTH_URL, etc.)
- [ ] Generate secure NEXTAUTH_SECRET (min 32 characters)
- [ ] Verify Firebase credentials are correct
- [ ] DO NOT commit `.env.production` to Git

### 2. Database

- [ ] Production database is set up and accessible
- [ ] Run `npm run db:push` to sync schema
- [ ] Run `npm run db:seed` to seed initial data (admin user + boards)
- [ ] Verify database connection works

### 3. Code Quality

- [ ] Run `npm run type-check` - No TypeScript errors
- [ ] Run `npm run lint` - No ESLint errors
- [ ] Test all critical features work
- [ ] Remove all console.log in production (auto-handled by logger)

### 4. Security

- [ ] Update NEXTAUTH_SECRET to production value
- [ ] Ensure Firebase service account is secure
- [ ] Enable HTTPS/SSL certificate
- [ ] Review CORS settings if applicable
- [ ] Check API rate limiting

### 5. Performance

- [ ] Images optimized
- [ ] Unused dependencies removed
- [ ] Build passes: `npm run build`
- [ ] Test production build locally: `npm run start:prod`

## 🏗️ Build & Deploy

### Build Command

\`\`\`bash
npm run prod:prepare
\`\`\`

This will:

1. Check TypeScript types
2. Run ESLint
3. Build optimized production bundle

### Start Production Server

\`\`\`bash
npm run start:prod
\`\`\`

Or standard:
\`\`\`bash
npm start
\`\`\`

## 🔧 Production Configuration

### Current Settings (next.config.ts)

- ✅ Standalone mode: **DISABLED** (not using Docker)
- ✅ React Strict Mode: **ENABLED**
- ✅ TypeScript strict checking: **ENABLED**
- ✅ Security headers: **CONFIGURED**
- ✅ Image optimization: **ENABLED**
- ✅ Compression: **ENABLED**
- ✅ Powered-by header: **HIDDEN**

### Performance Optimizations

- Package imports optimized (lucide-react, react-icons, date-fns)
- Image formats: AVIF & WebP
- Security headers for XSS, CORS, etc.

## 📊 Monitoring

### What to Monitor

- [ ] Application uptime
- [ ] Database connection status
- [ ] Firebase realtime connection
- [ ] API response times
- [ ] Error logs (check server console)
- [ ] User notifications working (FCM)

### Logging

- Production logs only show errors by default
- Set `ENABLE_LOGGING=true` in `.env.production` to enable all logs

## 🐛 Troubleshooting

### Build Fails

1. Check TypeScript errors: `npm run type-check`
2. Check ESLint errors: `npm run lint`
3. Verify all dependencies installed: `npm install`

### Database Connection Issues

1. Verify DATABASE_URL format
2. Check firewall allows connection
3. Test connection: `npx prisma studio`

### Firebase Not Working

1. Verify all NEXT*PUBLIC_FIREBASE*\* vars are set
2. Check FIREBASE_SERVICE_ACCOUNT JSON is valid
3. Ensure Firebase project is active

### Notifications Not Sending

1. Check FCM VAPID key is correct
2. Verify Firebase Admin credentials
3. Test in different browsers

## 📝 Post-Deployment

- [ ] Test login with admin account
- [ ] Create test card and verify notifications
- [ ] Check responsive design on mobile
- [ ] Verify all CRUD operations work
- [ ] Test real-time updates (Firebase)
- [ ] Monitor error logs for 24 hours

## 🔐 Security Best Practices

1. **Never** commit `.env.production` to Git
2. Use strong passwords for database
3. Keep Firebase service account secure
4. Regularly update dependencies
5. Monitor for suspicious activity
6. Enable rate limiting on API routes

## 🎯 Performance Targets

- First Contentful Paint: < 1.8s
- Time to Interactive: < 3.9s
- Lighthouse Score: > 90

---

**Ready for Production? ✨**

Run: `npm run prod:prepare && npm run start:prod`
