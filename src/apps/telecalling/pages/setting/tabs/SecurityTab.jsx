import { Stack } from "@mui/material";
import ActiveSessions from "../../../components/settings/security/ActiveSessions";

export default function SecurityTab() {
  return (
    <Stack spacing={3}>
      <ActiveSessions />
    </Stack>
  );
}
