// Supabase 클라이언트 설정

// 환경 변수 (배포 시 Vercel 환경 변수로 설정)
const SUPABASE_URL = 'https://fiwcaybpfjcjpeyaqtvk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpd2NheWJwZmpjanBleWFxdHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDgxNDAsImV4cCI6MjA4MjI4NDE0MH0.itpTQTLp3-5qJV1JyEQiBJOE8SyZa-Y7WZzxzFX-hMI';

// Supabase 클라이언트 생성
// CDN에서는 전역으로 supabase 객체가 노출됨
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 전역 변수로 설정 (다른 파일에서 사용하기 위함)
window.supabaseClient = supabaseClient;
