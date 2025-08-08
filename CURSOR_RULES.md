# Cursor Rules and Guidelines

## General Principles
1. **Code Quality**
   - Write clean, maintainable code
   - Follow consistent coding standards
   - Document complex logic with comments
   - Use meaningful variable and function names

2. **Version Control**
   - Commit frequently with descriptive messages
   - Create feature branches for new development
   - Review code before merging
   - Keep commits focused and atomic

3. **Security**
   - Never commit sensitive information (API keys, passwords)
   - Use environment variables for configuration
   - Validate all user input
   - Follow security best practices for your stack

## Development Workflow
1. **Planning**
   - Define clear requirements before coding
   - Break down tasks into manageable chunks
   - Consider edge cases and error handling
   - Document architecture decisions

2. **Coding**
   - Write tests alongside code
   - Use appropriate design patterns
   - Keep functions small and focused
   - Handle errors gracefully

3. **Testing**
   - Write unit tests for critical functionality
   - Test edge cases and error conditions
   - Perform integration testing
   - Document test cases

## Collaboration
1. **Code Review**
   - Review code for functionality and style
   - Provide constructive feedback
   - Address security concerns
   - Ensure documentation is complete

2. **Documentation**
   - Keep README files up to date
   - Document API endpoints
   - Include setup instructions
   - Maintain changelog

3. **Communication**
   - Use clear commit messages
   - Document breaking changes
   - Keep team informed of major updates
   - Use appropriate channels for different types of communication

## Best Practices
1. **Performance**
   - Optimize database queries
   - Minimize network requests
   - Use caching where appropriate
   - Profile and optimize bottlenecks

2. **Maintainability**
   - Follow DRY (Don't Repeat Yourself) principle
   - Use consistent code formatting
   - Keep dependencies up to date
   - Remove unused code

3. **Accessibility**
   - Follow WCAG guidelines
   - Test with screen readers
   - Ensure keyboard navigation
   - Use semantic HTML

## Emergency Procedures
1. **Production Issues**
   - Document incident response procedures
   - Maintain rollback procedures
   - Keep emergency contacts updated
   - Document post-mortem process

2. **Security Incidents**
   - Follow security incident response plan
   - Document and report vulnerabilities
   - Implement fixes promptly
   - Communicate with affected users

## Continuous Improvement
1. **Learning**
   - Stay updated with technology trends
   - Share knowledge with team
   - Document lessons learned
   - Attend relevant training

2. **Process**
   - Regularly review and update processes
   - Gather team feedback
   - Implement improvements
   - Measure effectiveness

Remember: These rules are guidelines to help maintain code quality and team efficiency. They should be adapted to your specific project needs and team requirements. 

Мы пишем чистый код, все должно быть модульно и масштабируемо. Никаких костылей, никаких больших файлов, никаких быстрых и временных решений. Если файл получается большой — разбивай на мелкие функции.

Код мы пишем в CursorAI, команды выполняем в powershell (работаем мы за ПК на Windows), проект подключенк к удаленной базе данных mongoDB.