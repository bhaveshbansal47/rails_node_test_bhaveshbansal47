import axios from "axios";

export const getCurrencies = async (): Promise<Record<string, string>> => {
    const response = await axios.get("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json");
    return response.data;
};
