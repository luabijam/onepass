export const EOL = '\n';
export const arch = () => 'arm64';
export const platform = () => 'android';
export const hostname = () => 'localhost';
export const type = () => 'Linux';
export const uptime = () => 0;
export const freemem = () => 0;
export const totalmem = () => 0;
export const cpus = () => [];
export const networkInterfaces = () => ({});
export const homedir = () => '/data/data/com.onepass';
export const tmpdir = () => '/tmp';
export const constants = {};
export const endianness = () => 'LE';
export const loadavg = () => [0, 0, 0];
export const userInfo = () => ({
  username: 'user',
  homedir: '/data/data/com.onepass',
  shell: null,
});
export default {
  EOL,
  arch,
  platform,
  hostname,
  type,
  uptime,
  freemem,
  totalmem,
  cpus,
  networkInterfaces,
  homedir,
  tmpdir,
  constants,
  endianness,
  loadavg,
  userInfo,
};
