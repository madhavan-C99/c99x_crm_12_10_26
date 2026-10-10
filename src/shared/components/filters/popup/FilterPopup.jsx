import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Select,
    MenuItem,
    Button,
} from "@mui/material";

import {
    getSelectOptions,
} from "@/shared/services/dropdownService";

import {
    FIELD_MAP,
    DEFAULT_LEAD_FILTERS,
    DEFAULT_PAYMENT_FILTERS,
} from "./filterConfig";

import {
    getCategoryKey,
    getDisplayLabel,
    normalize,
    buildOptFilter,
} from "./filterUtils";

const FilterPopup = ({
    selectedFilters,
    setSelectedFilters,
    onClose,

    dropdownCategory,

    open = true,

    selectedPipelineId = 0,
}) => {

    const [
        categories,
        setCategories,
    ] = useState([]);

    const [
        dropdownOptions,
        setDropdownOptions,
    ] = useState({});

    const [
        tempFilters,
        setTempFilters,
    ] = useState({});

    const [
        loading,
        setLoading,
    ] = useState(true);

    const getInitialFilters = () => {

        if (
            dropdownCategory ===
            "L_FETCH_FILTER_PAYMENT"
        ) {
            return {
                ...DEFAULT_PAYMENT_FILTERS,
            };
        }

        return {
            ...DEFAULT_LEAD_FILTERS,
        };
    };

    useEffect(() => {

        if (open) {

            setTempFilters(
                selectedFilters ||
                getInitialFilters()
            );

        }

    }, [
        open,
        selectedFilters,
    ]);

    const handleDropdownChange = (
        key,
        value
    ) => {

        setTempFilters((prev) => ({
            ...prev,
            [key]: value,
        }));

    };

    const handleApply = () => {

        setSelectedFilters(
            tempFilters
        );

        onClose();
    };

    const handleReset = () => {

        const initialFilters =
            getInitialFilters();

        setTempFilters(
            initialFilters
        );

        setSelectedFilters(
            initialFilters
        );
    };

const loadAllDropdowns = async (categoryList) => {
    try {
        // opt_filter ellaa field kum same, so oru thadava build pannina podhum
        const optFilter = buildOptFilter({
            selectedPipelineId,
            selectedFilters: tempFilters,
        });

        const responses = await Promise.all(
            categoryList.map(async (item) => {
                const fieldKey = getCategoryKey(item.label);

                const payload = {
                    field: fieldKey,
                    filter_id: "",
                    opt_filter: optFilter,
                };

                try {
                    const res = await getSelectOptions(payload);

                    return {
                        key: fieldKey,
                        data: [
                            { label: "All", value: 0 },
                            ...(res?.data?.data || []),
                        ],
                    };
                } catch (err) {
                    // oru field fail aanaalum matha fields-ai bayam illa
                    console.error(
                        "Dropdown failed for:",
                        fieldKey,
                        err?.response?.data || err
                    );

                    return {
                        key: fieldKey,
                        data: [{ label: "All", value: 0 }],
                    };
                }
            })
        );

        // STORE DROPDOWN OPTIONS
        const options = {};

        responses.forEach((item) => {
            options[item.key] = item.data;
        });

        setDropdownOptions(options);
    } catch (error) {
        console.error("Dropdown loading error:", error);
    }
};

    const loadFilterCategories =
        async () => {

            try {

                setLoading(true);

                const payload = {

                    field:
                        dropdownCategory,

                    filter_id:
                        "",
                };

                const res =
                    await getSelectOptions(
                        payload
                    );

                const data =
                    res?.data?.data ||
                    [];

                setCategories(
                    data
                );

                await loadAllDropdowns(
                    data
                );

            } catch (error) {

                console.error(
                    "Filter category error:",
                    error
                );

            } finally {

                setLoading(false);
            }

        };

    useEffect(() => {

        loadFilterCategories();

    }, [
        dropdownCategory,
        selectedPipelineId,
    ]);

    if (loading) {

        return (

            <Box
                sx={{
                    width: 400,
                    height: 420,

                    display: "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "center",
                }}
            >

                <Typography>
                    Loading Filters...
                </Typography>

            </Box>

        );

    }

    return (

        <Box
            sx={{
                width: 400,

                display: "flex",

                flexDirection:
                    "column",

                overflow: "hidden",

                bgcolor: "#fff",
            }}
        >

            {/* HEADER */}

            <Box
                sx={{
                    px: 2.5,
                    py: 1.2,

                    display: "flex",

                    justifyContent:
                        "space-between",

                    alignItems:
                        "center",

                    borderBottom:
                        "1px solid #ECECEC",
                }}
            >

                <Typography
                    sx={{
                        fontSize: 22,
                        fontWeight: 700,
                    }}
                >
                    Filter Leads
                </Typography>

                <Typography
                    onClick={
                        handleReset
                    }
                    sx={{
                        color:
                            "#8BC34A",

                        cursor:
                            "pointer",

                        fontWeight:
                            600,
                    }}
                >
                    Reset
                </Typography>

            </Box>

            {/* FILTER BODY */}

            <Box
                sx={{
                    flex: 1,

                    px: 2.5,

                    py: 1.5,

                    overflow:
                        "hidden",
                }}
            >

                {categories.map(
                    (item) => {

                        const normalized =
                            normalize(
                                item.label
                            );

                        const fieldKey =
                            FIELD_MAP[
                                normalized
                            ];

                        // Unknown category
                        if (!fieldKey) {
                            return null;
                        }

                        const categoryKey =
                            getCategoryKey(
                                item.label
                            );

                        const options =
                            dropdownOptions[
                                categoryKey
                            ] || [];

                        return (

                            <Box
                                key={
                                    item.label
                                }
                                sx={{
                                    display:
                                        "grid",

                                    gridTemplateColumns:
                                        "160px 1fr",

                                    alignItems:
                                        "center",

                                    mb: 1.1,
                                }}
                            >

                                <Typography
                                    sx={{
                                        fontSize: 14,

                                        fontWeight:
                                            500,

                                        color:
                                            "#333",
                                    }}
                                >
                                    {
                                        getDisplayLabel(
                                            item.label
                                        )
                                    }
                                </Typography>

<Select
    fullWidth
    size="small"
    value={tempFilters[fieldKey] ?? 0}
    onChange={(e) =>
        setTempFilters((prev) => ({
            ...prev,
            [fieldKey]: e.target.value,
        }))
    }
    MenuProps={{
        anchorOrigin: {
            vertical: "top",
            horizontal: "left",
        },
        transformOrigin: {
            vertical: "top",
            horizontal: "right",
        },
        PaperProps: {
            sx: {
                maxHeight: 250,
                minWidth: 180,
            },
        },
    }}
>
    {options.map((option) => (
        <MenuItem
            key={option.value}
            value={option.value}
        >
            {option.label}
        </MenuItem>
    ))}
</Select>
                                {/* <TextField
                                    select

                                    fullWidth

                                    size="small"

                                    value={
                                        tempFilters[
                                            fieldKey
                                        ] ??
                                        0
                                    }
                                    SelectProps={{
                                        MenuProps: {
                                            PaperProps: { sx: { maxHeight: 250 } },
                                        },
                                    }}

                                    onChange={(
                                        e
                                    ) =>
                                        handleDropdownChange(
                                            fieldKey,

                                            Number(
                                                e
                                                    .target
                                                    .value
                                            )
                                        )
                                    }

                                    sx={{
                                        "& .MuiOutlinedInput-root":
                                            {
                                                height:
                                                    34,

                                                fontSize:
                                                    14,

                                                borderRadius:
                                                    "6px",
                                            },

                                        "& .MuiSelect-select":
                                            {
                                                py:
                                                    0.7,
                                            },
                                    }}
                                >

                                    {options.map(
                                        (
                                            option
                                        ) => (

                                            <MenuItem
                                                key={
                                                    option.value
                                                }

                                                value={
                                                    option.value
                                                }
                                            >
                                                {
                                                    option.label
                                                }
                                            </MenuItem>

                                        )
                                    )}

                                </TextField> */}

                            </Box>

                        );

                    }
                )}

            </Box>

            {/* FOOTER */}

            <Box
                sx={{
                    p: 2,

                    display: "flex",

                    gap: 1.5,

                    borderTop:
                        "1px solid #ECECEC",
                }}
            >

                <Button
                    fullWidth

                    variant="outlined"

                    onClick={
                        handleReset
                    }

                    sx={{
                        height: 36,

                        textTransform:
                            "none",
                    }}
                >
                    Reset Filters
                </Button>

                <Button
                    fullWidth

                    variant="contained"

                    onClick={
                        handleApply
                    }

                    sx={{
                        height: 36,

                        background:
                            "#8BC34A",

                        textTransform:
                            "none",

                        "&:hover": {
                            background:
                                "#79B22F",
                        },
                    }}
                >
                    Apply Filters
                </Button>

            </Box>

        </Box>
    );
};

export default FilterPopup;
