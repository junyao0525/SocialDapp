export const formatEthAmount = (amount: string) => {
    const num = parseFloat(amount);
    return num > 0 ? num.toFixed(6) : '0.000000';
};