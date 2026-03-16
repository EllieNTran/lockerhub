interface HeadingProps {
  title: string;
  description: string;
}

const Heading = ({ title, description }: HeadingProps) => {
  return (
    <div>
          <h2 className="text-2xl font-bold text-dark-blue">{title}</h2>
          <p className="mt-1 text-sm text-grey">
            {description}
          </p>
    </div>
  )
}

export default Heading;
