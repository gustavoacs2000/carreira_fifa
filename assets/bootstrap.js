if (!window.ManagerApp || !window.ManagerAuth) {
  throw new Error('O Manager FC não conseguiu carregar todos os módulos necessários.');
}

window.ManagerAuth.initialize(window.ManagerApp);
