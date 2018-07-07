module.exports = {
  apps: [{
    name: 'API',
    script: './server.js',
    env: {
      COMMON_VARIABLE: 'true',
    },
    env_production: {
      NODE_ENV: 'production',
    },
  }],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy: {
    production: {
      user: 'node',
      host: ['jdkvm', 'qc3kvm', 'xrkvm'],
      ref: 'origin/master',
      repo: 'https://github.com/krwu/tgt-api.git',
      path: '/home/node/tgt-api',
      'post-deploy': 'source ~/.bash_profile && yarn install --prod && ln -sfv ../shared/config.json config.json && pm2 startOrRestart ecosystem.config.js --env production && pm2 save',
    },
    //    dev : {
    //      user : 'node',
    //      host : '212.83.163.1',
    //      ref  : 'origin/master',
    //      repo : 'git@github.com:repo.git',
    //      path : '/var/www/development',
    //      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env dev',
    //      env  : {
    //        NODE_ENV: 'dev'
    //      }
    //    }
  },
};
