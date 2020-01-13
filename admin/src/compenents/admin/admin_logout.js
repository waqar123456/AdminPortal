//admin logout request

// logout route
app.options('/auth/logout', cors({
    origin: enviroment.ALLOWED_ORIGINS,
    methods: 'DELETE',
  }))
  app.delete('/auth/logout', cors({
    origin: enviroment.ALLOWED_ORIGINS,
    methods: 'DELETE',
  }), async (req, res) => {
    console.log("req = ", req)
    const { headers } = req;
    const token = headers['x-auth-token']
    let result = null;
  
    request.delete(endPoints.KEYSTONEAUTH, {
      headers: {
        'X-Auth-Token': token,
        'X-Subject-Token': token
      },
      getResponse: true
    }).then((response) => {
      result = response;
      res.status(result.response.status).json(result)
    })
      .catch((error) => {
        result = error;
        res.status(result.response.status).json(result)
      })
  })