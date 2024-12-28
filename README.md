# Not Uygulaması

Modern ve kullanıcı dostu bir not alma uygulaması. Next.js, Firebase ve Tailwind CSS ile geliştirilmiştir.

## Özellikler

- 📝 Not oluşturma, düzenleme ve silme
- 🏷️ Kategori sistemi
- 🔍 Not arama
- 📅 Hatırlatıcılar
- 🌙 Koyu/Açık tema
- 📤 PDF olarak dışa aktarma
- 🖼️ Resim yükleme
- 🔗 Not paylaşımı
- 💬 Yorum sistemi

## Teknolojiler

- [Next.js 14](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [date-fns](https://date-fns.org/)
- [jsPDF](https://www.npmjs.com/package/jspdf)

## Kurulum

1. Projeyi klonlayın:
\`\`\`bash
git clone https://github.com/KULLANICI_ADI/not-uygulamasi.git
cd not-uygulamasi
\`\`\`

2. Bağımlılıkları yükleyin:
\`\`\`bash
pnpm install
\`\`\`

3. Firebase yapılandırmasını ayarlayın:
   - Firebase Console'dan yeni bir proje oluşturun
   - Authentication, Firestore ve Storage hizmetlerini etkinleştirin
   - Firebase yapılandırma bilgilerinizi `firebase/config.ts` dosyasına ekleyin

4. Geliştirme sunucusunu başlatın:
\`\`\`bash
pnpm dev
\`\`\`

## Lisans

MIT
