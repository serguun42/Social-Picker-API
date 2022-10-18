const IS_DEV = process.env.NODE_ENV === 'development' || process.argv[2] === 'DEV';

export default IS_DEV;
