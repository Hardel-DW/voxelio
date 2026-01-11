import { VersionRegistry } from "@/VersionRegistry";
import migrations_1_21 from "@/migrations/1.21";
import migrations_1_21_2 from "@/migrations/1.21.2";
import migrations_1_21_4 from "@/migrations/1.21.4";
import migrations_1_21_5 from "@/migrations/1.21.5";
import migrations_1_21_6 from "@/migrations/1.21.6";
import migrations_1_21_7 from "@/migrations/1.21.7";
import migrations_1_21_9 from "@/migrations/1.21.9";
import migrations_1_21_11 from "@/migrations/1.21.11";

export const versionRegistry: VersionRegistry = new VersionRegistry();
versionRegistry.register(48, migrations_1_21);
versionRegistry.register(57, migrations_1_21_2);
versionRegistry.register(61, migrations_1_21_4);
versionRegistry.register(71, migrations_1_21_5);
versionRegistry.register(80, migrations_1_21_6);
versionRegistry.register(81, migrations_1_21_7);
versionRegistry.register(86, migrations_1_21_9);
versionRegistry.register(94, migrations_1_21_11);