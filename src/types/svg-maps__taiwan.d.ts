declare module "@svg-maps/taiwan" {
  const taiwan: {
    viewBox: string;
    locations: Array<{
      path: string;
      id: string;
      name: string;
    }>;
  };
  export default taiwan;
}
