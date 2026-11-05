import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SecurityIcon from "@mui/icons-material/Security";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import GavelIcon from "@mui/icons-material/Gavel";
import EmailIcon from "@mui/icons-material/Email";
import LanguageIcon from "@mui/icons-material/Language";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/shared/assets/logo.webp";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial tab from path
  const getInitialTab = () => {
    if (location.pathname.includes("terms")) return 1;
    if (location.pathname.includes("data-deletion") || location.pathname.includes("deletion")) return 2;
    return 0;
  };

  const [tabValue, setTabValue] = useState(getInitialTab);

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="md">
        {/* Header Bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              component="img"
              src={logo}
              alt="C99X CRM Logo"
              sx={{ width: 44, height: 44, objectFit: "contain", borderRadius: 1.5 }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
                C99X CRM
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Enterprise Lead & Sales Management Platform
              </Typography>
            </Box>
          </Box>

          <Button
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
            onClick={() => navigate("/login")}
            sx={{
              borderColor: "#cbd5e1",
              color: "#334155",
              textTransform: "none",
              borderRadius: 2,
              "&:hover": { borderColor: "#94a3b8", bgcolor: "#f1f5f9" },
            }}
          >
            Back to Login
          </Button>
        </Box>

        {/* Navigation Tabs */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            mb: 3,
            bgcolor: "#ffffff",
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{
              borderBottom: "1px solid #e2e8f0",
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.85rem", sm: "0.95rem" },
                py: 2,
              },
            }}
          >
            <Tab icon={<SecurityIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Privacy Policy" />
            <Tab icon={<GavelIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Terms of Service" />
            <Tab icon={<DeleteOutlinedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="User Data Deletion" />
          </Tabs>

          <Box sx={{ p: { xs: 3, sm: 5 } }}>
            {/* TAB 0: PRIVACY POLICY */}
            {tabValue === 0 && (
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>
                  Privacy Policy
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
                  Last Updated: October 30, 2026 | Effective Date: October 30, 2026
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Typography variant="body1" sx={{ color: "#334155", mb: 3, lineHeight: 1.7 }}>
                  Welcome to <strong>C99X CRM</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operated by <strong>Code99 IT Academy</strong>. 
                  We respect your privacy and are committed to protecting personal data. This Privacy Policy outlines our 
                  practices regarding the collection, use, disclosure, and protection of information when you use our web application 
                  at <a href="https://crm.c99x.in" target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>https://crm.c99x.in</a> and our integration services, 
                  including our Meta (Facebook &amp; Instagram) integrations.
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mt: 3, mb: 1.5 }}>
                  1. Information We Collect
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569", mb: 2, lineHeight: 1.7 }}>
                  We collect information necessary to provide lead management, CRM pipeline workflows, and sales automation for our business customers:
                </Typography>
                <List dense sx={{ pl: 1, mb: 2 }}>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleOutlinedIcon sx={{ color: "#16a34a", fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Account Information"
                      secondary="Name, email address, phone number, company name, and authentication credentials."
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleOutlinedIcon sx={{ color: "#16a34a", fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Meta (Facebook & Instagram) Lead Data"
                      secondary="When you connect your Facebook Pages via Meta Login, we access and sync your Page details, Lead Ad forms, and incoming lead submissions (such as lead name, contact number, email, and responses submitted through your Lead Generation forms)."
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleOutlinedIcon sx={{ color: "#16a34a", fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="CRM Usage & Communications Data"
                      secondary="Lead statuses, pipeline stages, telecalling disposition notes, timestamps, and campaign performance statistics."
                    />
                  </ListItem>
                </List>

                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mt: 3, mb: 1.5 }}>
                  2. How We Use Your Information
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569", mb: 2, lineHeight: 1.7 }}>
                  We use the collected information exclusively for the following purposes:
                </Typography>
                <List dense sx={{ pl: 1, mb: 2 }}>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleOutlinedIcon sx={{ color: "#2563eb", fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText primary="To import and sync ad leads into your C99X CRM pipelines in real time." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleOutlinedIcon sx={{ color: "#2563eb", fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText primary="To display ad campaign sources and analytics to help your business monitor conversion rates." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleOutlinedIcon sx={{ color: "#2563eb", fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText primary="To authenticate users and enforce organization-level role security (Admins, Managers, Telecallers)." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleOutlinedIcon sx={{ color: "#2563eb", fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText primary="We NEVER sell, rent, or trade your personal or lead data to third parties, advertising networks, or data brokers." />
                  </ListItem>
                </List>

                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mt: 3, mb: 1.5 }}>
                  3. Meta Platform Data Compliance
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569", mb: 2, lineHeight: 1.7 }}>
                  Our application adheres strictly to the <strong>Meta Platform Terms</strong> and <strong>Developer Policies</strong>. 
                  When you authenticate with Facebook Login:
                </Typography>
                <List dense sx={{ pl: 1, mb: 2 }}>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleOutlinedIcon sx={{ color: "#0284c7", fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText primary="We request only the minimum required permissions (public_profile, leads_retrieval, pages_show_list, pages_manage_ads, pages_read_engagement) needed to deliver lead management features." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircleOutlinedIcon sx={{ color: "#0284c7", fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText primary="Access tokens are stored encrypted and used solely on behalf of the authenticated page administrator." />
                  </ListItem>
                </List>

                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mt: 3, mb: 1.5 }}>
                  4. Data Storage and Security
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569", mb: 2, lineHeight: 1.7 }}>
                  We implement robust technical and organizational security controls to safeguard data against unauthorized access, alteration, disclosure, or destruction. 
                  All communications between clients, Meta APIs, and our servers are encrypted using modern Transport Layer Security (TLS/HTTPS).
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mt: 3, mb: 1.5 }}>
                  5. Contact Us
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569", mb: 2, lineHeight: 1.7 }}>
                  If you have questions, comments, or concerns regarding this Privacy Policy, please contact our Data Protection Officer:
                </Typography>
                <Box sx={{ p: 2, bgcolor: "#f1f5f9", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                    Code99 IT Academy / C99X CRM
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#475569", display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    <EmailIcon sx={{ fontSize: 16, color: "#64748b" }} /> Email: <strong>code99itacademy@gmail.com</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#475569", display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    <LanguageIcon sx={{ fontSize: 16, color: "#64748b" }} /> Website: <a href="https://crm.c99x.in" target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>https://crm.c99x.in</a>
                  </Typography>
                </Box>
              </Box>
            )}

            {/* TAB 1: TERMS OF SERVICE */}
            {tabValue === 1 && (
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>
                  Terms of Service
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
                  Effective Date: October 30, 2026
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mb: 1.5 }}>
                  1. Acceptance of Terms
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569", mb: 2, lineHeight: 1.7 }}>
                  By accessing or using C99X CRM (located at <a href="https://crm.c99x.in" target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>https://crm.c99x.in</a>), 
                  you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mt: 3, mb: 1.5 }}>
                  2. Use of CRM Services
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569", mb: 2, lineHeight: 1.7 }}>
                  C99X CRM is provided for internal business operations, lead generation tracking, and client relationship management. 
                  You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your organization account.
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mt: 3, mb: 1.5 }}>
                  3. Third-Party Integrations (Meta, Google, etc.)
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569", mb: 2, lineHeight: 1.7 }}>
                  When using third-party integrations such as Meta Facebook Lead Ads, you warrant that you are the authorized administrator of the connected Facebook Page 
                  and comply with Meta&apos;s Advertising Policies and Terms of Service. We are not responsible for suspensions or actions taken by third-party platforms.
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mt: 3, mb: 1.5 }}>
                  4. Termination
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569", mb: 2, lineHeight: 1.7 }}>
                  We reserve the right to suspend or terminate accounts that violate our terms or engage in abusive, unlawful, or spam activities.
                </Typography>
              </Box>
            )}

            {/* TAB 2: USER DATA DELETION INSTRUCTIONS */}
            {tabValue === 2 && (
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mb: 1 }}>
                  User Data Deletion Instructions
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
                  In accordance with Meta Platform Developer Policy &amp; GDPR / Privacy Guidelines
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Typography variant="body1" sx={{ color: "#334155", mb: 3, lineHeight: 1.7 }}>
                  C99X CRM respects user rights to manage and delete their personal data and platform data. 
                  If you have connected your Facebook account or Page to C99X CRM and wish to delete your data or remove our application access, 
                  you can do so easily by following the instructions below:
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mt: 3, mb: 1.5 }}>
                  Method 1: Remove C99X CRM from Facebook Settings
                </Typography>
                <Box sx={{ p: 2.5, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0", mb: 3 }}>
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemText
                        primary="1. Log in to your Facebook Account."
                        secondary="Go to Settings &amp; Privacy > Settings."
                      />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText
                        primary="2. Navigate to Security and Login > Business Integrations (or Apps and Websites)."
                        secondary="Locate 'C99X CRM' in the list of active integrations."
                      />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemText
                        primary="3. Click 'Remove'."
                        secondary="This will revoke all access tokens and stop C99X CRM from accessing your Facebook Pages or Lead Ads."
                      />
                    </ListItem>
                  </List>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mt: 3, mb: 1.5 }}>
                  Method 2: Request Full Purge of Synced Lead Data
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569", mb: 2, lineHeight: 1.7 }}>
                  If you wish to permanently delete all leads, contact records, and metadata associated with your organization from our database:
                </Typography>
                <Box sx={{ p: 2.5, bgcolor: "#f1f5f9", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                  <Typography variant="body2" sx={{ color: "#1e293b", mb: 1 }}>
                    Send an email to our data privacy team at:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "#2563eb", mb: 1 }}>
                    code99itacademy@gmail.com
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b", lineHeight: 1.6 }}>
                    • <strong>Subject:</strong> C99X CRM Data Deletion Request<br />
                    • <strong>Details:</strong> Mention your registered email, company name, and the Facebook Page Name / ID.<br />
                    • Our team will process your request and permanently purge your data within <strong>30 calendar days</strong>, providing confirmation upon completion.
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            &copy; {new Date().getFullYear()} C99X CRM by Code99 IT Academy. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
