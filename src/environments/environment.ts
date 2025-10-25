export const environment = {
  production: false,
  supabase: {
    url: 'https://zdjbkyopawxijtvhseix.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkamJreW9wYXd4aWp0dmhzZWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjExMjUsImV4cCI6MjA3NjY5NzEyNX0.K1js984qUS3RFCNy8IyMywMwV-WDNC9tFCJPb0K4LHY'
  },
  wompi: {
    publicKey: 'pub_test_XXXXXXXXXXXXXXX', // Reemplazar con clave de prueba
    integritySecret: '', // Para validar webhooks (opcional)
  },
  apiUrl: 'http://localhost:3000', // API backend
  useMockData: false
};
