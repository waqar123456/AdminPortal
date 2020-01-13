//admin login UI and login request
var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const request = require('umi-request').default;
var cors = require('cors')
const { loadEnviromentVariables } = require('./loadEnviromentVariables');

// routers
const app = loadEnviromentVariables()(express())

// get all enviroment variables from .env using dotenv


// stop verifying self signed certificates if in development
if (process.env['NODE_ENV'] === 'development') {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
}

const enviroment = app.get('ENV');
const endPoints = {
  KEYSTONEAUTH: `${enviroment.OPENSTACK_KEYSTONE_URL}/auth/tokens/`,
  DOMAINSCOPES: `${enviroment.OPENSTACK_KEYSTONE_URL}/auth/domains`,
  PROJECTSCOPES: `${enviroment.OPENSTACK_KEYSTONE_URL}/auth/projects`,

}

// view engine setup
//KYSTONEAUTH: "http://10.81.1.240:5000/EYSTONEAUTH: "http://10.81.1.240:5000/v3/auth/tokens/",
// DOMAINSCOPES: "http://10.81.1.240:5000/v3/auth/domains",
// PROJECTSCOPES: "http://10.81.1.240:5000/v3/auth/projects"v3/auth/tokens/",
// DOMAINSCOPES: "http://10.81.1.240:5000/v3/auth/domains",
// PROJECTSCOPES: "http://10.81.1.240:5000/v3/auth/projects"


app.use(logger('dev'));
app.use(express.json());
// app.use(cors({

// }))
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// app.use(express.static(path.join(__dirname, 'public')));
// app.set('views', require('path').join(__dirname, 'views'));
// app.set('view engine', 'jade');
// var indexRouter = require('./routes/index');
// app.use('/', indexRouter);
// app.use('/users', usersRouter);

//


// login route initial
app.options('/auth/login', cors({
  origin: enviroment.ALLOWED_ORIGINS,
  methods: 'POST',
}))
app.post('/auth/login', cors({
  origin: enviroment.ALLOWED_ORIGINS,
  methods: 'POST',
}), async (req, res, next) => {
  const { body } = req;

  try {
    // get unscoped token
    const result = await request.post(endPoints.KEYSTONEAUTH, {

      data: {

        "auth": {
          "identity": {
            "methods": [
              "password"
            ],
            "password": {
              "user": {
                "name": `${body.username}`,
                "password": `${body.password}`,
                "domain": {
                  "name": `${body.organization}`
                }
              }
            }

          },
          "scope": "unscoped"
        }

      },
      headers: {
        'Content-Type': 'application/json',
      },
      getResponse: true
    })


    const unscopedToken = result.response.headers._headers['x-subject-token']

    try {
      const domainScopes = await request.get(endPoints.DOMAINSCOPES, {

        headers: {
          "X-Auth-Token": unscopedToken[0]
        },
        getResponse: true
      })

      const { domains } = domainScopes.data;


      // available domain scope (domain admin) hack
      if (domains.length !== 0) {
        const domain = domains[0];

        if (domain.enabled) {

          try {
            const scopedTokenResult = await request.post(endPoints.KEYSTONEAUTH, {

              data: {
                "auth": {
                  "identity": {
                    "methods": [
                      "token"
                    ],
                    "token": {
                      "id": unscopedToken[0]
                    }
                  },
                  "scope": {
                    "domain": {
                      "name": body.organization
                    }
                  }
                }

              },
              headers: {
                'Content-Type': 'application/json',
              },
              getResponse: true
            })

            // this is scoped token for the admin
            res.status(result.response.status).json({ tokenMetadata: { tokenId: scopedTokenResult.response.headers._headers['x-subject-token'][0], scope: 'domainScope' }, ...scopedTokenResult.data })


          } catch (error) {

          }

        } else {
          res.status(404).json({ body: { message: 'Invalid Credentials' } })
        }
      } else if (domains.length === 0) {


        try {
          // get all project scopes
          // select first project
          // get a projectscoped token for that project.

          const allProjects = await request.get(endPoints.PROJECTSCOPES, {

            getResponse: true,
            headers: {
              'X-Auth-Token': unscopedToken[0],
              'X-Subject-Token': unscopedToken[0],

            }
          })
          if (allProjects.data.projects.length === 0) {
            res.status(404).json({ body: { message: 'User does not have a project assigned to it' } })
            return;
          }
          const firstProject = allProjects.data.projects[0]
          const projectScopedToken = await request.post(endPoints.KEYSTONEAUTH, {

            getResponse: true,
            data: {
              "auth": {
                "identity": {
                  "methods": [
                    "token"
                  ],
                  "token": {
                    "id": unscopedToken[0]
                  }
                },
                "scope": {
                  "project": {
                    "id": firstProject.id
                  }
                }
              }
            }
          })

          const { data } = projectScopedToken;



          if (data.token.project !== undefined && Array.isArray(data.token.roles)) {
            let allData = { tokenMetadata: { tokenId: projectScopedToken.response.headers._headers['x-subject-token'][0], scope: 'projectScope' }, ...projectScopedToken.data, 'allProjects': allProjects.data.projects }
            // console.log("allProjects links = ", allProjects)
            res.status(result.response.status).json({ 
                tokenMetadata:
                 { tokenId:
                     projectScopedToken.response.headers._headers['x-subject-token'][0],
                  scope: 'projectScope' 
                }, ...projectScopedToken.data, 
                'allProjects': allProjects.data.projects,
                 'unscopedToken': unscopedToken[0]
                 })
                 
          } else {
            res.status(result.response.status).json({
                 tokenMetadata: {
                      tokenId: projectScopedToken.response.headers._headers['x-subject-token'][0],
                       scope: 'unscoped' 
                    }, ...projectScopedToken.data 
                    })
          }
        } catch (error) {
          // TODO HAVE TO SEE
        }
      }
    } catch (domainScopeError) {
      //TODO handle the error 
    }

  } catch (e) {
    res.status(e.data.error.code).json({
         body: { message: "Invalid Credentials" } })
  }
});


// Get Authoenticate token

app.get('/auth/verify-token', cors({
  origin: enviroment.ALLOWED_ORIGINS,
  methods: 'GET',
}), async (req, res, next) => {
  const { headers } = req;
  const { authToken } = headers;


  try {
    // get unscoped token
    const headers = {
      'X-Auth-Token': authToken,
      'X-Subject-Token': authToken,
    }
    const result = await request.get(endPoints.KEYSTONEAUTH, {
      getResponse: true,
      headers
    });

    res.status(result.response.status).json({ ...result.response })
  }
  catch (e) {
    console.log(e);
  }
})



// // Handles any requests that don't match the ones above
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname + '/dist/index.html'));
// });
//dist folder is the client build

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).json(err);
});

module.exports = admin_login;
