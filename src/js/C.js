
import Enum from 'easy-enums';
import Roles from './base/Roles';

// share the base C object
import C from './base/CBase';

export default C;

/**
 * app config
 */
C.app = {
	name: "Games",
	service: "games",
	logo: "/img/logo.png",
	website: "https://winterstein.me.uk",
	homeLogo: "/img/logo-white-sm.png",
	version: {app: '0.1.0'}
};

C.TYPES = new Enum("User Sprite");

C.ROLES = new Enum("admin player");
C.CAN = new Enum("edit publish admin");
// setup roles
Roles.defineRole(C.ROLES.admin, C.CAN.values);
