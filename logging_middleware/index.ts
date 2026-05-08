import axios from 'axios';

type Stack = 'backend' | 'frontend';

type Level = 'info' | 'error' | 'warn' | 'debug' | 'fatal';

type BackendPackage =
    | 'cache'
    | 'controller'
    | 'cron_job'
    | 'db'
    | 'domain'
    | 'handler'
    | 'repository'
    | 'route'
    | 'service';

type FrontendPackage =
    | 'component'
    | 'context'
    | 'hook'
    | 'page'
    | 'state'
    | 'style'
    | 'api';

type Package = BackendPackage | FrontendPackage;

interface LogPayload {
    stack: Stack;
    level: Level;
    package: Package;
    message: string;
}

const LOG_API_ENDPOINT =
    'http://4.224.186.213/evaluation-service/logs';

const BACKEND_PACKAGES: BackendPackage[] = [
    'cache',
    'controller',
    'cron_job',
    'db',
    'domain',
    'handler',
    'repository',
    'route',
    'service',
];

const FRONTEND_PACKAGES: FrontendPackage[] = [
    'component',
    'context',
    'hook',
    'page',
    'state',
    'style',
    'api',
];

const VALID_LEVELS: Level[] = [
    'info',
    'error',
    'warn',
    'debug',
    'fatal',
];

export const log = async (
    stack: Stack,
    level: Level,
    pkg: Package,
    message: string
): Promise<void> => {
    try {
        const validPackages =
            stack === 'backend'
                ? BACKEND_PACKAGES
                : FRONTEND_PACKAGES;

        const isValidPackage = validPackages.some(
            (p) => p === pkg
        );

        if (!VALID_LEVELS.includes(level) || !isValidPackage) {
            console.warn(
                `Invalid log params: stack=${stack}, level=${level}, pkg=${pkg}`
            );
            return;
        }

        await axios.post<LogPayload>(
            LOG_API_ENDPOINT,
            {
                stack,
                level,
                package: pkg,
                message,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    // Authorization: `Bearer ${token}`
                },
                timeout: 10000,
            }
        );
    } catch (err) {
        if (axios.isAxiosError(err)) {
            console.error(
                'Failed to send log:',
                err.response?.data || err.message
            );
        } else {
            console.error('Failed to send log:', err);
        }
    }
};

//was having internet issue for first 2 hours ip address was getting blocked so got this by faculty 
// {
//     "clientID": "01b57342-c5a0-4b55-97d8-79ac8966a50f",
//     "clientSecret": "wNfDhNtXahXvTpxf"
// }