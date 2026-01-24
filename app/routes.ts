import {type RouteConfig, index, route} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('/auth', 'routes/auth.tsx'),
    route('/upload', 'routes/upload.tsx'),
    route('/resume/:id', 'routes/resume.tsx'),
    route('/job-applier', 'routes/job-applier.tsx'),
    route('/saved-jobs', 'routes/saved-jobs.tsx'),
    route('/applications', 'routes/applications.tsx'),
    route('/skills-gap', 'routes/skills-gap.tsx'),
    route('/search-history', 'routes/search-history.tsx'),
    route('/wipe', 'routes/wipe.tsx'),
] satisfies RouteConfig;
