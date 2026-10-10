
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Typography,
    Divider,
} from "@mui/material";

const ExportDialog = ({
    open,
    onClose,
    columnList,
    selectedColumns,
    handleColumnChange,
    handleExport,
    handleSelectAll,
    handleClearAll,
}) => {

    const allSelected = selectedColumns.length === columnList.length;
    const handleSelectAllToggle = () => {
        if (allSelected) {
            handleClearAll();
        } else {
            handleSelectAll();
        }
    };

    return (

        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                },
            }}
        >

            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pb: 1,
                }}
            >

                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Select Columns
                </Typography>

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={allSelected}
                            indeterminate={
                                selectedColumns.length > 0 && !allSelected
                            }
                            onChange={handleSelectAllToggle}
                            size="small"
                        />
                    }
                    label={
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            All
                        </Typography>
                    }
                    sx={{ mr: 0 }}
                />

            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 2 }}>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1,
                        mt: 1,
                    }}
                >

                    {columnList.map((item) => (

                        <FormControlLabel

                            key={item.key}

                            control={

                                <Checkbox

                                    checked={
                                        selectedColumns.includes(item.key)
                                    }

                                    onChange={() =>
                                        handleColumnChange(item.key)
                                    }

                                />

                            }

                            label={item.label}

                        />

                    ))}

                </Box>

            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2 }}>

                <Button
                    onClick={onClose}
                    sx={{ textTransform: "none" }}
                >
                    Cancel
                </Button>

                <Button
                    variant="contained"
                    onClick={() => {
                        handleExport();
                        onClose();
                    }}
                    sx={{ textTransform: "none", borderRadius: 1.5 }}
                >
                    Export
                </Button>

            </DialogActions>

        </Dialog>

    );

};

export default ExportDialog;
