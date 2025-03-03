const config = {
  API_URL: import.meta.env.PROD 
    ? 'https://vincenthuei91.infinityfreeapp.com/api'
    : 'http://localhost:5000',
  GITHUB_PAGES_URL: 'https://vincentyap91.github.io',
  APP_PATH: '/todolist'
};

export default config; 