import express from 'express';

export const authRouter = express();

authRouter.get('/sign-up/:page', (req, res) => {
  const { page } = req.params;

  res.oidc.login({
    returnTo: page,
    authorizationParams: {
      screen_hint: 'signup'
    }
  });
});

authRouter.get('/login/:page', (req, res) => {
  const { page } = req.params;
  console.log(page);

  res.oidc.login({
    returnTo: page
  });
});

authRouter.get('/logout/:page', (req, res) => {
  const { page } = req.params;
  console.log(page);

  res.oidc.logout({
    returnTo: page
  });
});
